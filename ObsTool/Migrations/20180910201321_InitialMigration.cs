using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using System;
using System.Collections.Generic;

namespace ObsTool.Migrations
{
    public partial class InitialMigration : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Articles",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn),
                    Description = table.Column<string>(nullable: false),
                    Difficulty = table.Column<int>(nullable: false),
                    InterestRating = table.Column<int>(nullable: false),
                    Priority = table.Column<int>(nullable: false),
                    SearchField = table.Column<int>(nullable: false),
                    Season = table.Column<int>(nullable: false),
                    Title = table.Column<string>(maxLength: 500, nullable: false),
                    Type = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Articles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Constellations",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn),
                    Abbreviation = table.Column<string>(nullable: true),
                    Name = table.Column<string>(nullable: true),
                    Season = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Constellations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Locations",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn),
                    GoogleMapsAddress = table.Column<string>(nullable: true),
                    Latitude = table.Column<float>(nullable: true),
                    Longitude = table.Column<float>(nullable: true),
                    Name = table.Column<string>(maxLength: 250, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SacDeepSkyObjects",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn),
                    All_common_names = table.Column<string>(maxLength: 500, nullable: true),
                    BCHM = table.Column<string>(maxLength: 50, nullable: true),
                    BRSTR = table.Column<string>(maxLength: 50, nullable: true),
                    Catalog = table.Column<string>(maxLength: 50, nullable: false),
                    Catalog_number = table.Column<string>(maxLength: 50, nullable: true),
                    Class = table.Column<string>(maxLength: 50, nullable: true),
                    Common_name = table.Column<string>(maxLength: 200, nullable: true),
                    Con = table.Column<string>(maxLength: 50, nullable: false),
                    DEC = table.Column<string>(maxLength: 50, nullable: false),
                    Dreyer_desc = table.Column<string>(maxLength: 100, nullable: true),
                    Mag = table.Column<string>(maxLength: 50, nullable: false),
                    NSTS = table.Column<string>(maxLength: 50, nullable: true),
                    Name = table.Column<string>(maxLength: 50, nullable: false),
                    Notes = table.Column<string>(maxLength: 100, nullable: true),
                    Other_names = table.Column<string>(maxLength: 50, nullable: true),
                    PA = table.Column<string>(maxLength: 50, nullable: true),
                    RA = table.Column<string>(maxLength: 50, nullable: false),
                    SB = table.Column<string>(maxLength: 50, nullable: false),
                    Size_max = table.Column<string>(maxLength: 50, nullable: true),
                    Size_min = table.Column<string>(maxLength: 50, nullable: true),
                    TI = table.Column<int>(nullable: false),
                    Type = table.Column<string>(maxLength: 50, nullable: false),
                    U2K = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SacDeepSkyObjects", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ArticleConstellations",
                columns: table => new
                {
                    ArticleId = table.Column<int>(nullable: false),
                    ConstellationId = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleConstellations", x => new { x.ArticleId, x.ConstellationId });
                    table.ForeignKey(
                        name: "FK_ArticleConstellations_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ArticleConstellations_Constellations_ConstellationId",
                        column: x => x.ConstellationId,
                        principalTable: "Constellations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ObsSessions",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn),
                    Conditions = table.Column<string>(maxLength: 4000, nullable: true),
                    Date = table.Column<DateTime>(nullable: true),
                    LimitingMagnitude = table.Column<decimal>(nullable: true),
                    LocationId = table.Column<int>(nullable: true),
                    ReportText = table.Column<string>(nullable: true),
                    Seeing = table.Column<int>(nullable: true),
                    Summary = table.Column<string>(maxLength: 4000, nullable: true),
                    Title = table.Column<string>(maxLength: 500, nullable: true),
                    Transparency = table.Column<int>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ObsSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ObsSessions_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ArticleDsoObjects",
                columns: table => new
                {
                    ArticleId = table.Column<int>(nullable: false),
                    DsoId = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleDsoObjects", x => new { x.ArticleId, x.DsoId });
                    table.ForeignKey(
                        name: "FK_ArticleDsoObjects_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ArticleDsoObjects_SacDeepSkyObjects_DsoId",
                        column: x => x.DsoId,
                        principalTable: "SacDeepSkyObjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Observations",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn),
                    CustomObjectName = table.Column<string>(nullable: true),
                    DisplayOrder = table.Column<int>(nullable: true),
                    DsoId = table.Column<int>(nullable: false),
                    ObsSessionId = table.Column<int>(nullable: false),
                    Text = table.Column<string>(maxLength: 4000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Observations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Observations_SacDeepSkyObjects_DsoId",
                        column: x => x.DsoId,
                        principalTable: "SacDeepSkyObjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Observations_ObsSessions_ObsSessionId",
                        column: x => x.ObsSessionId,
                        principalTable: "ObsSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ObsResources",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(maxLength: 250, nullable: true),
                    ObservationId = table.Column<int>(nullable: false),
                    Type = table.Column<string>(maxLength: 20, nullable: true),
                    Url = table.Column<string>(maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ObsResources", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ObsResources_Observations_ObservationId",
                        column: x => x.ObservationId,
                        principalTable: "Observations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ArticleConstellations_ConstellationId",
                table: "ArticleConstellations",
                column: "ConstellationId");

            migrationBuilder.CreateIndex(
                name: "IX_ArticleDsoObjects_DsoId",
                table: "ArticleDsoObjects",
                column: "DsoId");

            migrationBuilder.CreateIndex(
                name: "IX_Observations_DsoId",
                table: "Observations",
                column: "DsoId");

            migrationBuilder.CreateIndex(
                name: "IX_Observations_ObsSessionId",
                table: "Observations",
                column: "ObsSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_ObsResources_ObservationId",
                table: "ObsResources",
                column: "ObservationId");

            migrationBuilder.CreateIndex(
                name: "IX_ObsSessions_LocationId",
                table: "ObsSessions",
                column: "LocationId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ArticleConstellations");

            migrationBuilder.DropTable(
                name: "ArticleDsoObjects");

            migrationBuilder.DropTable(
                name: "ObsResources");

            migrationBuilder.DropTable(
                name: "Constellations");

            migrationBuilder.DropTable(
                name: "Articles");

            migrationBuilder.DropTable(
                name: "Observations");

            migrationBuilder.DropTable(
                name: "SacDeepSkyObjects");

            migrationBuilder.DropTable(
                name: "ObsSessions");

            migrationBuilder.DropTable(
                name: "Locations");
        }
    }
}
