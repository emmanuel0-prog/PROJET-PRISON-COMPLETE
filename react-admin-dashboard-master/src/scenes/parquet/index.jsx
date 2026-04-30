import React, { useState, useEffect } from "react";
import {
  Box, Typography, useTheme, alpha, Button, Grid, Paper,
  IconButton, Stack, TextField, MenuItem, Dialog, DialogTitle, 
  DialogContent, Snackbar, Alert, Chip, Divider, Avatar, Zoom, Fade
} from "@mui/material";

import {
  SecurityOutlined, AddOutlined, EditOutlined, DeleteSweepOutlined,
  ContactPhoneOutlined, AccountBalanceOutlined, Refresh, 
  CloseOutlined, SaveOutlined, HubOutlined, LocationCityOutlined
} from "@mui/icons-material";

import { DataGrid, frFR, GridToolbarQuickFilter } from "@mui/x-data-grid";

// ✅ API CENTRALISÉ
import api from "../../api";

// Identité visuelle RDC
const DRC_BLUE = "#007FFF";
const DRC_YELLOW = "#F7D618";
const DRC_RED = "#CE1021";

// ✅ ROUTES PROPRES (sans localhost)
const PARQUET_ENDPOINT = "/parquets/";
const TRIBUNAL_ENDPOINT = "/tribunaux/";

const TYPES_PARQUET = [
  { code: "PG", label: "Parquet Général", color: "#9c27b0" },
  { code: "PGI", label: "Parquet de Grande Instance", color: "#2196f3" },
  { code: "PP", label: "Parquet près Tribunal de Paix", color: "#4caf50" },
  { code: "PM", label: "Parquet Militaire", color: "#f44336" },
];

const ParquetManager = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  
  const mainBg = isDark ? "#0a1929" : "#f0f2f5";
  const paperBg = isDark ? alpha("#132f4c", 0.8) : "#ffffff";
  const borderColor = isDark ? alpha(DRC_BLUE, 0.3) : alpha(DRC_BLUE, 0.1);
  const textColor = theme.palette.text.primary;

  const [parquets, setParquets] = useState([]);
  const [tribunaux, setTribunaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [currentParquet, setCurrentParquet] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const [formData, setFormData] = useState({
    nom: "", type_parquet: "", ville: "Kinshasa", tribunal: "", adresse: "", contact_procureur: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resParq, resTrib] = await Promise.all([
        api.get(PARQUET_ENDPOINT),
        api.get(TRIBUNAL_ENDPOINT)
      ]);
      setParquets(resParq.data);
      setTribunaux(resTrib.data);
    } catch (err) {
      setToast({ open: true, message: "Erreur de liaison réseau avec le serveur", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setCurrentParquet(item);
      setFormData({
        ...item,
        tribunal: item.tribunal || "" // Assure la compatibilité si le tribunal est nul
      });
    } else {
      setCurrentParquet(null);
      setFormData({ nom: "", type_parquet: "", ville: "Kinshasa", tribunal: "", adresse: "", contact_procureur: "" });
    }
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (!formData.nom || !formData.type_parquet) {
      setToast({ open: true, message: "Champs obligatoires manquants", severity: "warning" });
      return;
    }
    try {
      if (currentParquet) {
        await api.put(`${PARQUET_ENDPOINT}${currentParquet.id}/`, formData);
      } else {
        await api.post(PARQUET_ENDPOINT, formData);
      }
      setOpenModal(false);
      fetchData();
      setToast({ open: true, message: "Base de données mise à jour", severity: "success" });
    } catch (err) {
      setToast({ open: true, message: "Erreur lors de l'enregistrement", severity: "error" });
    }
  };

  // --- FONCTION SUPPRESSION SÉCURISÉE ---
  const handleDelete = async (id) => {
    if (window.confirm("⚠️ ALERTE SÉCURITÉ : Voulez-vous vraiment révoquer ce Parquet du système ? Cette action est irréversible.")) {
      try {
        await api.delete(`${PARQUET_ENDPOINT}${id}/`);
        fetchData();
        setToast({ 
          open: true, 
          message: "Parquet supprimé avec succès du registre central", 
          severity: "warning" 
        });
      } catch (err) {
        setToast({ 
          open: true, 
          message: "Erreur : Impossible de supprimer une ressource liée", 
          severity: "error" 
        });
      }
    }
  };

  const columns = [
    { 
      field: "nom", 
      headerName: "DÉSIGNATION", 
      flex: 1.5, 
      renderCell: (p) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar 
            sx={{ 
              width: 32, height: 32, 
              bgcolor: alpha(DRC_BLUE, 0.2), 
              color: DRC_BLUE, 
              border: `1px solid ${DRC_BLUE}`,
              fontSize: 14, fontWeight: 900 
            }}
          >
            {p.value?.charAt(0) || "P"}
          </Avatar>
          <Typography variant="body2" fontWeight={700} sx={{ color: textColor, textTransform: 'uppercase' }}>
            {p.value}
          </Typography>
        </Stack>
      )
    },
    { 
      field: "type_parquet", 
      headerName: "JURIDICTION", 
      width: 180, 
      renderCell: (p) => {
        const type = TYPES_PARQUET.find(x => x.code === p.value);
        return (
          <Chip 
            label={type ? type.label : p.value} 
            size="small" 
            sx={{ 
              borderRadius: "4px", 
              fontWeight: 800, 
              bgcolor: alpha(type?.color || DRC_BLUE, 0.1),
              color: type?.color || DRC_BLUE,
              border: `1px solid ${alpha(type?.color || DRC_BLUE, 0.4)}`,
              fontSize: '10px'
            }} 
          />
        );
      }
    },
    { field: "ville", headerName: "VILLE", width: 130 },
    { 
      field: "actions", 
      headerName: "CONTROL", 
      width: 120, 
      sortable: false, 
      align: 'right',
      renderCell: (p) => (
        <Stack direction="row" spacing={1}>
          <IconButton 
            size="small" 
            onClick={() => handleOpenModal(p.row)} 
            sx={{ color: DRC_BLUE, "&:hover": { bgcolor: alpha(DRC_BLUE, 0.1) } }}
          >
            <EditOutlined fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleDelete(p.row.id)} // RELIÉ ICI
            sx={{ color: DRC_RED, "&:hover": { bgcolor: alpha(DRC_RED, 0.1) } }}
          >
            <DeleteSweepOutlined fontSize="small" />
          </IconButton>
        </Stack>
      )
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: mainBg, minHeight: "100vh", transition: "background 0.3s ease" }}>
      
      {/* BANDEAU SUPÉRIEUR */}
      <Fade in={true}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, mb: 4, borderRadius: "12px", 
            border: `1px solid ${borderColor}`,
            background: isDark ? `linear-gradient(135deg, ${alpha("#132f4c", 0.9)} 0%, ${alpha("#0a1929", 0.9)} 100%)` : "#fff",
            backdropFilter: "blur(10px)",
            display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center'
          }}
        >
          <Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, bgcolor: DRC_BLUE, borderRadius: "10px", display: 'flex', boxShadow: `0 0 15px ${alpha(DRC_BLUE, 0.4)}` }}>
                <SecurityOutlined sx={{ color: "#fff" }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: "-1.5px", color: textColor, lineHeight: 1 }}>
                  PARQUET <span style={{ color: DRC_BLUE }}>OS</span>
                </Typography>
                <Typography variant="caption" sx={{ color: DRC_BLUE, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  Système de Gestion du Ministère Public • RDC
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Stack direction="row" spacing={2}>
            <IconButton onClick={fetchData} sx={{ border: `1px solid ${borderColor}`, borderRadius: "8px" }}><Refresh /></IconButton>
            <Button 
              variant="contained" 
              startIcon={<AddOutlined />} 
              onClick={() => handleOpenModal()}
              sx={{ 
                bgcolor: DRC_BLUE, color: "#fff", fontWeight: 800, borderRadius: "8px", px: 3,
                boxShadow: `0 4px 14px 0 ${alpha(DRC_BLUE, 0.4)}`,
                "&:hover": { bgcolor: "#0066cc", transform: "translateY(-2px)" },
                transition: "all 0.2s"
              }}
            >
              Initialiser un Parquet
            </Button>
          </Stack>
        </Paper>
      </Fade>

      {/* TABLEAU PRINCIPAL */}
      <Zoom in={true} style={{ transitionDelay: '100ms' }}>
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: "12px", border: `1px solid ${borderColor}`,
            overflow: 'hidden', bgcolor: paperBg, backdropFilter: "blur(10px)"
          }}
        >
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={parquets}
              columns={columns}
              loading={loading}
              localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
              slots={{ toolbar: GridToolbarQuickFilter }}
              slotProps={{ 
                toolbar: { 
                  sx: { 
                    p: 2, 
                    borderBottom: `1px solid ${borderColor}`,
                    "& .MuiInputBase-root": { borderRadius: "8px", bgcolor: alpha(textColor, 0.05), px: 2 }
                  } 
                } 
              }}
              sx={{ 
                border: "none",
                color: textColor,
                "& .MuiDataGrid-columnHeaders": { bgcolor: alpha(textColor, 0.02), fontWeight: 900 },
                "& .MuiDataGrid-cell": { borderColor: borderColor },
                "& .MuiDataGrid-row:hover": { bgcolor: alpha(DRC_BLUE, 0.04) }
              }}
            />
          </Box>
        </Paper>
      </Zoom>

      {/* MODAL DE CONFIGURATION */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)} 
        fullWidth maxWidth="md"
        TransitionComponent={Zoom}
        PaperProps={{ 
          sx: { 
            borderRadius: "20px", 
            bgcolor: isDark ? "#0a1929" : "#fff",
            backgroundImage: "none",
            border: `1px solid ${alpha(DRC_BLUE, 0.5)}`,
            boxShadow: `0 20px 50px ${alpha("#000", 0.3)}`
          } 
        }}
      >
        <DialogTitle sx={{ p: 3, borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <HubOutlined sx={{ color: DRC_BLUE }} />
            <Typography fontWeight={900} variant="h6">ARCHITECTURE DU NŒUD JUDICIAIRE</Typography>
          </Stack>
          <IconButton onClick={() => setOpenModal(false)}><CloseOutlined /></IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField 
                fullWidth label="NOM OFFICIEL" 
                variant="filled" 
                value={formData.nom} 
                onChange={(e) => setFormData({...formData, nom: e.target.value.toUpperCase()})} 
                sx={{ "& .MuiFilledInput-root": { borderRadius: "8px" } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField 
                select fullWidth label="TYPE DE PARQUET" 
                variant="filled"
                value={formData.type_parquet} 
                onChange={(e) => setFormData({...formData, type_parquet: e.target.value})}
                sx={{ "& .MuiFilledInput-root": { borderRadius: "8px" } }}
              >
                {TYPES_PARQUET.map(t => <MenuItem key={t.code} value={t.code}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField 
                select fullWidth label="TRIBUNAL DE RATTACHEMENT" 
                variant="filled"
                value={formData.tribunal} 
                onChange={(e) => setFormData({...formData, tribunal: e.target.value})}
                sx={{ "& .MuiFilledInput-root": { borderRadius: "8px" } }}
                helperText="Liaison hiérarchique avec le siège"
              >
                <MenuItem value=""><em>Aucun tribunal lié</em></MenuItem>
                {tribunaux.map(t => <MenuItem key={t.id} value={t.id}>{t.nom}</MenuItem>)}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth label="PROCUREUR / AUDITEUR EN CHEF" 
                variant="filled"
                value={formData.contact_procureur} 
                onChange={(e) => setFormData({...formData, contact_procureur: e.target.value})} 
                sx={{ "& .MuiFilledInput-root": { borderRadius: "8px" } }}
                InputProps={{ startAdornment: <ContactPhoneOutlined sx={{mr:1, color: DRC_BLUE}}/> }} 
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ mb: 1 }}><Chip label="COORDONNÉES GÉOGRAPHIQUES" size="small" sx={{ fontWeight: 900, bgcolor: alpha(DRC_YELLOW, 0.1), color: isDark ? DRC_YELLOW : "#856404" }} /></Divider>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField 
                fullWidth label="VILLE / RESSORT" 
                variant="filled"
                value={formData.ville} 
                onChange={(e) => setFormData({...formData, ville: e.target.value})} 
                sx={{ "& .MuiFilledInput-root": { borderRadius: "8px" } }}
                InputProps={{ startAdornment: <LocationCityOutlined sx={{mr:1}}/> }}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField 
                fullWidth label="ADRESSE PHYSIQUE COMPLÈTE" 
                variant="filled"
                value={formData.adresse} 
                onChange={(e) => setFormData({...formData, adresse: e.target.value})} 
                sx={{ "& .MuiFilledInput-root": { borderRadius: "8px" } }}
              />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button 
                fullWidth variant="contained" 
                onClick={handleSave} 
                startIcon={<SaveOutlined />} 
                sx={{ 
                  bgcolor: DRC_BLUE, color: "#fff", py: 2, fontWeight: 900, borderRadius: "12px",
                  fontSize: '1rem', boxShadow: `0 8px 20px ${alpha(DRC_BLUE, 0.3)}`,
                  "&:hover": { bgcolor: "#005bb5", boxShadow: `0 12px 25px ${alpha(DRC_BLUE, 0.5)}` }
                }}
              >
                {currentParquet ? "METTRE À JOUR LE REGISTRE" : "INSCRIRE DANS LE SYSTÈME CENTRAL"}
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* SYSTÈME DE NOTIFICATION */}
      <Snackbar open={toast.open} autoHideDuration={5000} onClose={() => setToast({...toast, open: false})}>
        <Alert 
          severity={toast.severity} 
          variant="filled" 
          onClose={() => setToast({...toast, open: false})}
          sx={{ 
            borderRadius: "10px", 
            fontWeight: 800, 
            boxShadow: 6,
            bgcolor: toast.severity === 'success' ? DRC_BLUE : toast.severity === 'warning' ? DRC_RED : undefined
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ParquetManager;