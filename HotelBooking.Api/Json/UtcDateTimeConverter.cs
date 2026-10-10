using System.Text.Json;
using System.Text.Json.Serialization;

namespace HotelBooking.Api.Json;

/// <summary>
/// JSON-bound dates (e.g. "2026-12-08") deserialize with Kind=Unspecified,
/// which Npgsql refuses to send to timestamptz columns. Treat wall-clock
/// input as UTC so every comparison/insert uses a UTC instant.
/// </summary>
public class UtcDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var d = reader.GetDateTime();
        return d.Kind == DateTimeKind.Utc ? d : DateTime.SpecifyKind(d, DateTimeKind.Utc);
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value);
}
