using System.Text.Json.Serialization;

namespace Abstracciones.Usuarios
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum RolUsuario
    {
        Administrador,
        Coordinador,
        Veterinario,
        Voluntario
    }
}
