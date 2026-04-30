import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, Avatar, useTheme, alpha, Grid,
  LinearProgress, TextField, MenuItem, InputAdornment, CircularProgress
} from "@mui/material";
import { DataGrid, frFR } from "@mui/x-data-grid";
import {
  FingerprintOutlined, CheckCircleOutline, WarningOutlined,
  SdCardOutlined, RefreshOutlined, VerifiedUserOutlined,
  PersonOutlined, SearchOutlined,
} from "@mui/icons-material";

import API from "../../api"; // Ton instance Axios

/* ---------------- COMPOSANT STATS ---------------- */
const MiniStat = ({ title, value, icon, color }) => {
  const theme = useTheme();
  return (
    <Box sx={{
      p: 2, borderRadius: "12px", bgcolor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`, display: "flex", alignItems: "center", gap: 2,
    }}>
      <Box sx={{ p: 1, borderRadius: "8px", bgcolor: alpha(color, 0.1), color, display: "flex" }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>{title}</Typography>
        <Typography variant="h6" fontWeight={700}>{value}</Typography>
      </Box>
    </Box>
  );
};

/* ---------------- PAGE BIOMÉTRIE ---------------- */
const Biometrie = () => {
  const theme = useTheme();
  
  // États de données
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  
  // États de filtrage
  const [search, setSearch] = useState("");
  const [prison, setPrison] = useState("Toutes");
  const [statut, setStatut] = useState("Tous");

  // --- RÉCUPÉRATION DES DONNÉES ---
  const fetchBiometrie = async () => {
    setLoading(true);
    try {
      const res = await API.get("biometrie/empreintes/");
      // Formattage pour le DataGrid
      const formatted = res.data.map((item) => ({
        id: item.id,
        ecrou: item.detenu_info.matricule,
        nom: `${item.detenu_info.nom} ${item.detenu_info.postnom || ""}`,
        statut: item.detenu_info.statut_juridique,
        prison: item.detenu_info.prison_nom,
        score: item.qualite,
        type: "Digital",
        photo: item.detenu_info.photo,
      }));
      setRows(formatted);
    } catch (e) {
      console.error("Erreur API:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBiometrie();
  }, []);

  // --- ACTION DE SCAN (SIMULATION + ENREGISTREMENT) ---
  const handleScan = async () => {
    setIsScanning(true);
    try {
      // On simule l'envoi vers l'API d'un scan pour le détenu ID:1 (à adapter selon sélection)
      await API.post("biometrie/empreintes/", {
        detenu: 1, 
        code_empreinte: "TEMPLATE_FINGERPRINT_" + Math.random().toString(36),
        qualite: Math.floor(Math.random() * 20) + 80, // Score entre 80 et 100
        appareil: "ZKTeco Slim 20",
      });
      setTimeout(() => {
        fetchBiometrie();
        setIsScanning(false);
      }, 1500);
    } catch (e) {
      alert("Erreur lors de l'enrôlement biométrique");
      setIsScanning(false);
    }
  };

  const columns = [
    { field: "ecrou", headerName: "N° Écrou", width: 120, headerAlign: 'center', align: 'center' },
    { 
      field: "nom", 
      headerName: "Identité", 
      flex: 1.2, 
      renderCell: (p) => (
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar src={p.row.photo} sx={{ width: 30, height: 30 }} />
          <strong>{p.value}</strong>
        </Box>
      ) 
    },
    {
      field: "type",
      headerName: "Type",
      width: 100,
      renderCell: () => <FingerprintOutlined sx={{ color: theme.palette.primary.main }} />,
    },
    {
      field: "prison",
      headerName: "Établissement",
      flex: 1,
    },
    {
      field: "statut",
      headerName: "Statut",
      flex: 1,
      renderCell: ({ value }) => {
        let color = theme.palette.success.main;
        if (value === "PREVENU") color = theme.palette.warning.main;
        if (value === "CONDAMNE") color = theme.palette.error.main;
        return <Typography variant="body2" sx={{ color, fontWeight: 700 }}>{value}</Typography>;
      },
    },
    {
      field: "score",
      headerName: "Fiabilité",
      flex: 1,
      renderCell: ({ value }) => (
        <Box width="100%" display="flex" alignItems="center" gap={1}>
          <LinearProgress 
            variant="determinate" 
            value={value} 
            color={value > 85 ? "success" : "warning"} 
            sx={{ flexGrow: 1, height: 6, borderRadius: 3 }} 
          />
          <Typography variant="caption" fontWeight={700}>{value}%</Typography>
        </Box>
      ),
    },
  ];

  return (
    <Box p={{ xs: 2, md: 4 }} sx={{ minHeight: "100vh", bgcolor: theme.palette.background.default }}>
      
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Module <span style={{ color: theme.palette.primary.main }}>Biométrique</span>
          </Typography>
          <Typography variant="body2" color="text.secondary">Contrôle d'intégrité et identification dactyloscopique</Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button 
            startIcon={<RefreshOutlined />} 
            variant="outlined" 
            onClick={fetchBiometrie}
            sx={{ borderRadius: "8px", textTransform: "none" }}
          >
            Actualiser
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={isScanning ? <CircularProgress size={20} color="inherit" /> : <FingerprintOutlined />} 
            onClick={handleScan}
            disabled={isScanning}
            sx={{ borderRadius: "8px", fontWeight: 700, textTransform: "none", px: 3 }}
          >
            {isScanning ? "Scan en cours..." : "Nouvel Enrôlement"}
          </Button>
        </Box>
      </Box>

      {/* FILTRES */}
      <Box sx={{ 
        p: 2, mb: 3, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center",
        bgcolor: theme.palette.background.paper, borderRadius: "12px", border: `1px solid ${theme.palette.divider}` 
      }}>
        <TextField
          size="small"
          placeholder="Rechercher un détenu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: "200px" }}
          InputProps={{
            startAdornment: (<InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment>),
          }}
        />
        
        <TextField select size="small" label="Prison" value={prison} onChange={(e) => setPrison(e.target.value)} sx={{ minWidth: "150px" }}>
          {["Toutes", "Makala", "Beni", "Ndolo"].map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
        </TextField>

        <Button variant="contained" color="secondary" sx={{ textTransform: "none", px: 4 }}>Filtrer</Button>
      </Box>

      {/* DATA GRID */}
      <Box sx={{
        height: 520, bgcolor: theme.palette.background.paper, borderRadius: "12px",
        border: `1px solid ${theme.palette.divider}`, overflow: "hidden",
      }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Box>

      {/* STATS RAPIDES */}
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} md={3}><MiniStat title="Taux de Capture" value="98.2%" icon={<VerifiedUserOutlined />} color={theme.palette.success.main} /></Grid>
        <Grid item xs={12} md={3}><MiniStat title="Qualité Scan < 50%" value="12" icon={<WarningOutlined />} color={theme.palette.warning.main} /></Grid>
        <Grid item xs={12} md={3}><MiniStat title="Identités Uniques" value={rows.length} icon={<PersonOutlined />} color={theme.palette.info.main} /></Grid>
        <Grid item xs={12} md={3}><MiniStat title="Intégrité Base" value="Optimale" icon={<SdCardOutlined />} color={theme.palette.secondary.main} /></Grid>
      </Grid>
    </Box>
  );
};

export default Biometrie;