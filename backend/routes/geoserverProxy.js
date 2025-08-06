const express = require("express");
const router = express.Router();
const axios = require("axios");

const GEOSERVER_URL = process.env.GEOSERVER_BASE;
const GEOSERVER_USER = process.env.GEOSERVER_USER;
const GEOSERVER_PASS = process.env.GEOSERVER_PASS;

module.exports = (db) => {
  
  // vector proxy
  router.get("/:layer", async (req, res) => {
    const { layer } = req.params;

    const allowedLayers = {
      nationalRoads: "GMS:hotosm_phl_roads_lines_shp",
      soilType: "GMS:daSoil",
      GeolPhils: "GMS:Geol_Phils_MGB",
      Nipas: "GMS:Nipas_",
      KBA: "GMS:KBA_",
      abraRiver: "GMS:Abra River Basin",
      agnoRiver: "GMS:Agno River Basin",
      agusanRiver: "GMS:Agusan River Basin",
      apayaoRiver: "GMS:Apayao-Abulug River Basin",
      bicolRiver: "GMS:Bicol River Basin",
      buayanRiver: "GMS:Buayan-Malungon River Basin",
      cagayanRiver: "GMS:Cagayan River Basin",
      BirdSanctuary: "GMS:Game_Refuge_and_Bird_Sanctuary",
      NationalPark: "GMS:National_Park",
      ProtectedSea: "GMS:Protected_Seascape",
      WatershedReserve: "GMS:Watershed_Reservation",
      // Stream Networks
      AbatanStream: "GMS:Abatan_stream",
      AbraStream: "GMS:Abra_stream",
      AbulugStream: "GMS:Abulug_stream",
      AgnoStream: "GMS:Agno_stream",
      AgusStream: "GMS:Agus_stream",
      AgusanStream: "GMS:Agusan_stream",
      AklanStream: "GMS:Aklan_stream",
      AmburayanStream: "GMS:Amburayan_stream",
      AmnayStream: "GMS:Amnay_stream",
      AngatStream: "GMS:Angat_stream",
      AringayStream: "GMS:Aringay_stream",
      AsigaStream: "GMS:Asiga_stream",
      BagoStream: "GMS:Bago_stream",
      BaliteStream: "GMS:Balite_stream",
      BaseyStream: "GMS:Basey_stream",
      BatoStream: "GMS:Bato_stream",
      BauangStream: "GMS:Bauang_stream",
      BayawanStream: "GMS:Bayawan_stream",
      BicolStream: "GMS:Bicol_stream",
      BinalbaganStream: "GMS:Binalbagan_stream",
      BislakStream: "GMS:Bislak_stream",
      BisligStream: "GMS:Bislig_stream",
      BongabongStream: "GMS:Bongabong_stream",
      BucaoStream: "GMS:Bucao_stream",
      CadacanStream: "GMS:Cadacan_stream",
      CagarananStream: "GMS:Cagaranan_stream",
      CagayanStream: "GMS:Cagayan_stream",
      CagayandeOroStream: "GMS:CagayandeOro_stream",
      CagurayStream: "GMS:Caguray_stream",
      CalbigaStream: "GMS:Calbiga_stream",
      CalumpangStream: "GMS:Calumpang_stream",
      CantilanStream: "GMS:Cantilan_stream",
      CaragaStream: "GMS:Caraga_stream",
      CasaumanStream: "GMS:Casauman_stream",
      CatarmanStream: "GMS:Catarman_stream",
      CateelStream: "GMS:Cateel_stream",
      CatubigStream: "GMS:Catubig_stream",
      DaguitanMarabangStream: "GMS:DaguitanMarabang_stream",
      DavaoStream: "GMS:Davao_stream",
      DikayuStream: "GMS:Dikayu_stream",
      DinasStream: "GMS:Dinas_stream",
      DipologStream: "GMS:Dipolog_stream",
      DitekiStream: "GMS:Diteki_stream",
      DoloresStream: "GMS:Dolores_stream",
      GandaraStream: "GMS:Gandara_stream",
      GlanStream: "GMS:Glan_stream",
      HimogaanStream: "GMS:Himogaan_stream",
      HinatuanStream: "GMS:Hinatuan_stream",
      IlianStream: "GMS:Ilian_stream",
      IlogHilabanganStream: "GMS:IlogHilabangan_stream",
      InabangaStream: "GMS:Inabanga_stream",
      InfantaStream: "GMS:Infanta_stream",
      InginMarasStream: "GMS:InginMaras_stream",
      IponanStream: "GMS:Iponan_stream",
      JalaurStream: "GMS:Jalaur_stream",
      JibatangStream: "GMS:Jibatang_stream",
      KalaongStream: "GMS:Kalaong_stream",
      KilbayCatabanganStream: "GMS:KilbayCatabangan_stream",
      KraanStream: "GMS:Kraan_stream",
      LabanganStream: "GMS:Labangan_stream",
      LaboStream: "GMS:Labo_stream",
      LaoagStream: "GMS:Laoag_stream",
      LasangStream: "GMS:Lasang_stream",
      LittleLunStream: "GMS:LittleLun_stream",
      LlorenteStream: "GMS:Llorente_stream",
      LobocStream: "GMS:Loboc_stream",
      LubaoStream: "GMS:Lubao_stream",
      LumangbayanStream: "GMS:Lumangbayan_stream",
      LumintaoStream: "GMS:Lumintao_stream",
      MagasawangTubigStream: "GMS:MagasawangTubig_stream",
      MagbandoStream: "GMS:Magbando_stream",
      MakarStream: "GMS:Makar_stream",
      MalakingIlogStream: "GMS:MalakingIlog_stream",
      MalaylayStream: "GMS:Malaylay_stream",
      MalungonStream: "GMS:Malungon_stream",
      MamburaoStream: "GMS:Mamburao_stream",
      MandulogStream: "GMS:Mandulog_stream",
      ManoStream: "GMS:Mano_stream",
      MarandingStream: "GMS:Maranding_stream",
      MarikinaPasigStream: "GMS:MarikinaPasig_stream",
      MatlingStream: "GMS:Matling_stream",
      MongpongStream: "GMS:Mongpong_stream",
      NorteLauisStream: "GMS:NorteLauis_stream",
      OdionganStream: "GMS:Odiongan_stream",
      OgodStream: "GMS:Ogod_stream",
      OrasStream: "GMS:Oras_stream",
      PadalaMainitStream: "GMS:PadalaMainit_stream",
      PagatbanStream: "GMS:Pagatban_stream",
      PagbahanStream: "GMS:Pagbahan_stream",
      PagsangahanStream: "GMS:Pagsangahan_stream",
      PalananStream: "GMS:Palanan_stream",
      PaloStream: "GMS:Palo_stream",
      PambuKhanStream: "GMS:PambuKhan_stream",
      PampangaStream: "GMS:Pampanga_stream",
      PamplonaStream: "GMS:Pamplona_stream",
      PanayStream: "GMS:Panay_stream",
      PansipitStream: "GMS:Pansipit_stream",
      ParoDapitanStream: "GMS:ParoDapitan_stream",
      PatalanDagupanStream: "GMS:PatalanDagupan_stream",
      QuipitStream: "GMS:Quipit_stream",
      RioGrandedeMindanaoStream: "GMS:RioGrandedeMindanao_stream",
      RizalStream: "GMS:Rizal_stream",
      RoxasStream: "GMS:Roxas_stream",
      SablayanStream: "GMS:Sablayan_stream",
      SalugStream: "GMS:Salug_stream",
      SangputanStream: "GMS:Sangputan_stream",
      SibalomStream: "GMS:Sibalom_stream",
      SibugueyStream: "GMS:Sibuguey_stream",
      SibulaoStream: "GMS:Sibulao_stream",
      SiguelStream: "GMS:Siguel_stream",
      SilayStream: "GMS:Silay_stream",
      SindanganStream: "GMS:Sindangan_stream",
      SioconStream: "GMS:Siocon_stream",
      SipalayStream: "GMS:Sipalay_stream",
      SipocongStream: "GMS:Sipocong_stream",
      SumlogStream: "GMS:Sumlog_stream",
      SuribaoStream: "GMS:Suribao_stream",
      TaboanStream: "GMS:Taboan_stream",
      TaftStream: "GMS:Taft_stream",
      TagoStream: "GMS:Tago_stream",
      TagoloanStream: "GMS:Tagoloan_stream",
      TagumStream: "GMS:Tagum_stream",
      TanjayStream: "GMS:Tanjay_stream",
      TernateStream: "GMS:Ternate_stream",
      TianStream: "GMS:Tian_stream",
      TigumStream: "GMS:Tigum_stream",
      UlotStream: "GMS:Ulot_stream",
      UmirayStream: "GMS:Umiray_stream",
    };

    const typeName = allowedLayers[layer];
    if (!typeName) {
      return res.status(400).json({ error: "Invalid layer name" });
    }

    try {
      const response = await axios.get(GEOSERVER_URL, {
        params: {
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName,
          outputFormat: "application/json",
          maxFeatures: 500000,
        },
        auth: {
          username: GEOSERVER_USER,
          password: GEOSERVER_PASS,
        },
      });

      res.json(response.data);
    } catch (err) {
      console.error("GeoServer proxy error:", err.message);
      res.status(500).json({ error: "Failed to fetch layer from GeoServer" });
    }
  });

  // raster proxy
  router.get("/", async (req, res) => {
    try {
      const params = {
        service: "WMS",
        version: "1.1.1",
        request: "GetMap",
        layers: req.query.layer,
        styles: "",
        bbox: req.query.bbox,
        width: req.query.width || "256",
        height: req.query.height || "256",
        srs: req.query.srs || "EPSG:3857",
        format: "image/png",
        transparent: "true",
      };

      const response = await axios.get(GEOSERVER_URL, {
        responseType: "arraybuffer", // So image data is returned correctly
        params,
        auth: {
          username: GEOSERVER_USER,
          password: GEOSERVER_PASS,
        },
      });

      res.set("Content-Type", "image/png");
      res.send(response.data);
    } catch (error) {
      console.error("WMS proxy error:", error.message);
      res.status(500).send("Failed to fetch WMS tile.");
    }
  });

  router.get("/layer", async (req, res) => {
    const { layer } = req.params;

    const typeName = "GMS:hotosm_phl_roads_lines_shp";
    // if (!typeName) {
    //   return res.status(400).json({ error: "Invalid layer name" });
    // }

    try {
      const response = await axios.get(GEOSERVER_URL, {
        params: {
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName,
          outputFormat: "application/json",
          maxFeatures: 500000,
        },
        auth: {
          username: GEOSERVER_USER,
          password: GEOSERVER_PASS,
        },
      });
      console.log(response)
      res.json(response.data);
    } catch (err) {
      console.error("GeoServer proxy error:", err.message);
      res.status(500).json({ error: "Failed to fetch layer from GeoServer" });
    }
  });

  return router;
};
