namespace AdopcionWeb.Models;

public class SolicitudFormularioInput
{
    public int AnimalId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Identificacion { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public int TipoViviendaId { get; set; }
    public string DescripcionHogar { get; set; } = string.Empty;
    public string OtrasMascotas { get; set; } = string.Empty;
    public bool AceptaVisita { get; set; }
}
