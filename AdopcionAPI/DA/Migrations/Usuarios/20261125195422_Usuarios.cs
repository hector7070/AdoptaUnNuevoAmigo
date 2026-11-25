using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DA.Migrations.Usuarios
{
    /// <inheritdoc />
    public partial class Usuarios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    ID_USUARIO = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NOMBRE = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    APELLIDO_PATERNO = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    APELLIDO_MATERNO = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CORREO = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    NOMBRE_USUARIO = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CONTRASENIA_HASH = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ACTIVO = table.Column<bool>(type: "bit", nullable: false),
                    ROL = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.ID_USUARIO);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_CORREO",
                table: "Usuarios",
                column: "CORREO",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_NOMBRE_USUARIO",
                table: "Usuarios",
                column: "NOMBRE_USUARIO",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}
