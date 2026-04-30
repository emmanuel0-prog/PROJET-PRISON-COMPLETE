import {
  Box,
  Button,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  Tooltip
} from "@mui/material";
import {
  Header,
  StatBox,
  LineChart,
  ProgressCircle,
  BarChart,
  GeographyChart,
} from "../../components";
import {
  DownloadOutlined,
  PeopleAltOutlined,
  GavelOutlined,
  FingerprintOutlined,
  WarningAmberOutlined,
  LocationOnOutlined,
} from "@mui/icons-material";
import { tokens } from "../../theme";
import { mockTransactions } from "../../data/mockData";


function Dashboard() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isXlDevices = useMediaQuery("(min-width: 1260px)");
  const isMdDevices = useMediaQuery("(min-width: 724px)");
  const isXsDevices = useMediaQuery("(max-width: 436px)");

  return (
    <Box m="20px">
      {/* HEADER NATIONAL */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header
          title="SYSTÈME NATIONAL D'ÉCROU"
          subtitle="Tableau de bord de pilotage - République Démocratique du Congo"
        />
        {!isXsDevices && (
          <Button
            variant="contained"
            sx={{
              bgcolor: colors.blueAccent[700],
              color: "#fcfcfc",
              fontSize: "14px",
              fontWeight: "bold",
              p: "10px 20px",
              borderRadius: "0px", // Style brutaliste pour administration
              border: `1px solid ${colors.gray[100]}`,
            }}
            startIcon={<DownloadOutlined />}
          >
            RAPPORT NATIONAL (PDF)
          </Button>
        )}
      </Box>

      {/* GRILLE DES INDICATEURS CLÉS */}
      <Box
        display="grid"
        gridTemplateColumns={
          isXlDevices ? "repeat(12, 1fr)" : isMdDevices ? "repeat(6, 1fr)" : "repeat(3, 1fr)"
        }
        gridAutoRows="140px"
        gap="20px"
      >
        {/* TOTAL DÉTENUS */}
        <Box gridColumn="span 3" bgcolor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center">
          <StatBox
            title="87,432"
            subtitle="Population Carcérale Totale"
            progress="0.85"
            increase="+2.4%"
            icon={<PeopleAltOutlined sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
          />
        </Box>

        {/* CONDAMNÉS (DÉFINITIFS) */}
        <Box gridColumn="span 3" bgcolor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center">
          <StatBox
            title="31,209"
            subtitle="Condamnés définitifs"
            progress="0.35"
            increase="-1%"
            icon={<GavelOutlined sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
          />
        </Box>

        {/* PRÉVENUS (EN ATTENTE) */}
        <Box gridColumn="span 3" bgcolor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center">
          <StatBox
            title="56,223"
            subtitle="Prévenus (Détention préventive)"
            progress="0.64"
            increase="+12%"
            icon={<WarningAmberOutlined sx={{ color: colors.redAccent[500], fontSize: "26px" }} />}
          />
        </Box>

        {/* COUVERTURE BIOMÉTRIQUE */}
        <Box gridColumn="span 3" bgcolor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center">
          <StatBox
            title="98.2%"
            subtitle="Couverture Biométrique"
            progress="0.98"
            increase="Haut standard"
            icon={<FingerprintOutlined sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
          />
        </Box>

        {/* ---------------- LIGNE 2 ---------------- */}

        {/* GRAPHIQUE D'ÉVOLUTION */}
        <Box
          gridColumn={isXlDevices ? "span 8" : "span 6"}
          gridRow="span 2"
          bgcolor={colors.primary[400]}
        >
          <Box mt="25px" px="30px" display="flex" justifyContent="space-between">
            <Box>
              <Typography variant="h5" fontWeight="600" color={colors.gray[100]}>
                Évolution mensuelle des flux (Entrées vs Sorties)
              </Typography>
            </Box>
            <Tooltip title="Télécharger les données brutes">
              <IconButton>
                <DownloadOutlined sx={{ fontSize: "26px", color: colors.greenAccent[500] }} />
              </IconButton>
            </Tooltip>
          </Box>
          <Box height="250px" mt="-20px">
            <LineChart isDashboard={true} />
          </Box>
        </Box>

        {/* LISTE DES DERNIERS MOUVEMENTS */}
        <Box
          gridColumn={isXlDevices ? "span 4" : "span 6"}
          gridRow="span 2"
          bgcolor={colors.primary[400]}
          overflow="auto"
        >
          <Box borderBottom={`4px solid ${colors.primary[500]}`} p="15px" display="flex" justifyContent="space-between">
            <Typography color={colors.gray[100]} variant="h5" fontWeight="600">
              Flux Récents (Mouvements)
            </Typography>
            <Typography variant="caption" color={colors.greenAccent[500]}>Temps réel</Typography>
          </Box>
          {mockTransactions.map((tx, i) => (
            <Box
              key={`${tx.txId}-${i}`}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              borderBottom={`1px solid ${colors.primary[500]}`}
              p="15px"
            >
              <Box>
                <Typography color={colors.greenAccent[500]} fontWeight="600">{tx.txId}</Typography>
                <Typography color={colors.gray[100]} variant="body2">{tx.user} (Makala)</Typography>
              </Box>
              <Typography variant="caption">{tx.date}</Typography>
              <Box bgcolor={colors.blueAccent[700]} p="5px 10px" fontSize="10px" fontWeight="bold">
                {i % 2 === 0 ? "ENTRÉE" : "SORTIE"}
              </Box>
            </Box>
          ))}
        </Box>

        {/* ---------------- LIGNE 3 ---------------- */}

        {/* TAUX D'OCCUPATION PAR PROVINCE */}
        <Box gridColumn={isXlDevices ? "span 4" : "span 3"} gridRow="span 2" bgcolor={colors.primary[400]} p="30px">
          <Typography variant="h5" fontWeight="600">Surpopulation Moyenne</Typography>
          <Box display="flex" flexDirection="column" alignItems="center" mt="25px">
            <ProgressCircle size="125" progress="0.78" color={colors.redAccent[500]} />
            <Typography variant="h4" color={colors.redAccent[500]} sx={{ mt: "15px" }}>
              245%
            </Typography>
            <Typography textAlign="center" variant="caption">
              Critique : Dépassement de la capacité d'accueil nationale
            </Typography>
          </Box>
        </Box>

        {/* RÉPARTITION PAR CATÉGORIE PENALE */}
        <Box gridColumn={isXlDevices ? "span 4" : "span 3"} gridRow="span 2" bgcolor={colors.primary[400]}>
          <Typography variant="h5" fontWeight="600" p="30px 0 0 30px">
            Types d'Infractions Dominantes
          </Typography>
          <Box height="250px" mt="-20px">
            <BarChart isDashboard={true} />
          </Box>
        </Box>

        {/* CARTE NATIONALE DES PRISONS */}
        <Box gridColumn={isXlDevices ? "span 4" : "span 3"} gridRow="span 2" bgcolor={colors.primary[400]} p="30px">
          <Typography variant="h5" fontWeight="600" mb="15px" display="flex" alignItems="center" gap={1}>
            <LocationOnOutlined /> Localisation des Établissements
          </Typography>
          <Box height="200px">
            <GeographyChart isDashboard={true} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Dashboard;  