using System.Text.Json;
using System.Text.Json.Serialization;

namespace AdopcionWeb.Clients;

public static class OpcionesJsonApi
{
    public static readonly JsonSerializerOptions Valor = Crear();

    private static JsonSerializerOptions Crear()
    {
        var opciones = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        opciones.Converters.Add(new JsonStringEnumConverter());
        return opciones;
    }
}
