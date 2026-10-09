using System.Data.Common;
using System.Text;
using System.Text.Json.Serialization;
using HotelBooking.Api.Services;
using HotelBooking.Data.DbContexts;
using HotelBooking.Data.EntityModels;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(o =>
    o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "HotelBooking API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header, Name = "Authorization",
        Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT",
        Description = "Enter: Bearer {token}"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
    });
});

var dbProvider = builder.Configuration.GetValue<string>("Database:Provider") ?? "SqlServer";
var usePostgres = dbProvider.Equals("Postgres", StringComparison.OrdinalIgnoreCase)
    || dbProvider.Equals("Npgsql", StringComparison.OrdinalIgnoreCase);

builder.Services.AddDbContext<HotelDbContext>(o =>
{
    var cs = builder.Configuration.GetConnectionString("Default");
    if (usePostgres) o.UseNpgsql(cs);
    else o.UseSqlServer(cs);
});

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(o =>
    {
        o.Password.RequireNonAlphanumeric = false;
        o.Password.RequireUppercase = false;
        o.Password.RequiredLength = 6;
    })
    .AddEntityFrameworkStores<HotelDbContext>()
    .AddDefaultTokenProviders();

var jwt = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(o =>
    {
        o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true, ValidateAudience = true,
            ValidateLifetime = true, ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"], ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection("Email"));
builder.Services.AddSingleton<IEmailSender>(sp =>
    string.Equals(sp.GetRequiredService<IOptions<EmailOptions>>().Value.Method, "Smtp", StringComparison.OrdinalIgnoreCase)
        ? (IEmailSender)new SmtpEmailSender(sp.GetRequiredService<IOptions<EmailOptions>>())
        : new FileEmailSender(sp.GetRequiredService<IOptions<EmailOptions>>(), sp.GetRequiredService<ILogger<FileEmailSender>>()));
builder.Services.AddRazorPages(); // server-rendered pages (e.g. /dashboard) alongside the JSON API + Angular SPA
// Trust Render/Cloud TLS-terminating proxies so https redirection doesn't loop.
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownNetworks.Clear();
    o.KnownProxies.Clear();
});
builder.Services.AddCors(o => o.AddPolicy("ng", p =>
{
    var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? ["http://localhost:4200"];
    p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
}));

var app = builder.Build();

// Free Postgres hosts have no migration history: create a fresh schema from the
// current model (including HasData seed). SQL Server keeps the versioned flow:
// run `dotnet ef database update` against it instead.
if (usePostgres)
{
    using var scope = app.Services.CreateScope();
    var pg = scope.ServiceProvider.GetRequiredService<HotelDbContext>();
    var csb = new DbConnectionStringBuilder
    {
        ConnectionString = builder.Configuration.GetConnectionString("Default")
    };
    var host = csb.TryGetValue("Host", out var h) ? h : "(unknown host)";
    var port = csb.TryGetValue("Port", out var p) ? p : "(unknown port)";
    try
    {
        app.Logger.LogInformation("Postgres init: connecting to {Host}:{Port}. Expecting the Supabase DIRECT (5432) connection string.", host, port);
        // Supabase ships its own tables, so EF's "any table exists" check lies.
        // Check for OUR marker table instead, and create explicitly when missing.
        var marker = await pg.Database.SqlQueryRaw<long>(
            "SELECT COUNT(*) AS \"Value\" FROM pg_tables WHERE schemaname = 'public' AND tablename = 'AspNetRoles'")
            .SingleAsync();
        if (marker == 0)
        {
            // Tables-only script: the database itself already exists (we're connected to it).
            app.Logger.LogInformation("Postgres schema missing — creating tables + seed data...");
            await pg.Database.ExecuteSqlRawAsync(pg.Database.GenerateCreateScript());
        }
        else
        {
            app.Logger.LogInformation("Postgres schema already present.");
        }
        app.Logger.LogInformation("Postgres schema ready.");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "FATAL: cannot reach Postgres at {Host}:{Port}. Check ConnectionStrings__Default is the Supabase DIRECT (port 5432, Username=postgres) string with the correct password, and the Supabase project is active.", host, port);
        throw;
    }
}

await DataSeeder.SeedAsync(app.Services);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseForwardedHeaders();
app.UseHttpsRedirection();
app.UseCors("ng");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapRazorPages();
app.Run();
