import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box, Typography, useTheme, alpha, Button, Grid, Stack, Paper,
  IconButton, Divider, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, TextField, MenuItem, Snackbar, Alert, Tooltip
} from "@mui/material";
import {
  Refresh, AddOutlined, EditOutlined, DeleteSweepOutlined,
  LocationOnOutlined, SupervisorAccountOutlined, CorporateFareOutlined,
  NumbersOutlined, CloseOutlined, SaveOutlined
} from "@mui/icons-material";
import { DataGrid, frFR, GridToolbarQuickFilter, GridToolbarContainer } from "@mui/x-data-grid";

import api from "../../api";

// Couleurs Officielles RDC
const DRC_BLUE = "#007FFF";
const DRC_YELLOW = "#F7D618";
const DRC_RED = "#CE1021";
const API_URL = "/prisons/";

const PrisonManager = () => {
  const theme = useTheme();
  const bc = theme.palette.mode === "dark" ? "#fff" : "#000";
  const inv = theme.palette.mode === "dark" ? "#000" : "#fff";

  // États
  const [prisons, setPrisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [currentPrison, setCurrentPrison] = useState(null); // null = Ajout, {data} = Edition
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  // Formulaire
  const [formData, setFormData] = useState({
    nom: "", code: "", adresse: "", capacite: "", directeur: "Cadre Pénitentiaire à désigner", ville: 1
  });

  const showToast = (msg, sev = "success") => setToast({ open: true, message: msg, severity: sev });

  // --- ACTIONS API ---
  const fetchPrisons = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_URL);
      setPrisons(res.data);
    } catch (err) {
      showToast("Erreur de connexion au serveur", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrisons(); }, []);

  const handleOpenModal = (prison = null) => {
    if (prison) {
      setCurrentPrison(prison);
      setFormData(prison);
    } else {
      setCurrentPrison(null);
      setFormData({ nom: "", code: "", adresse: "", capacite: "", directeur: "Cadre Pénitentiaire à désigner", ville: 1 });
    }
    setOpenModal(true);
  };

  const handleSave = async () => {
    try {
      if (currentPrison) {
        await api.put(`${API_URL}${currentPrison.id}/`, formData);
        showToast("Établissement mis à jour avec succès");
      } else {
        await api.post(API_URL, formData);
        showToast("Nouvel établissement enregistré");
      }
      setOpenModal(false);
      fetchPrisons();
    } catch (err) {
      showToast("Erreur lors de l'enregistrement", "error");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet établissement de la carte pénitentiaire ?")) {
      try {
        await api.delete(`${API_URL}${id}/`);
        showToast("Établissement supprimé", "warning");
        fetchPrisons();
      } catch (err) {
        showToast("Erreur de suppression", "error");
      }
    }
  };

  // --- CONFIGURATION TABLEAU ---
  const CustomToolbar = () => (
    <GridToolbarContainer sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
      <GridToolbarQuickFilter sx={{ width: 300 }} />
      <Button variant="contained" startIcon={<AddOutlined />} onClick={() => handleOpenModal()} sx={{ bgcolor: bc, color: inv, fontWeight: 900, borderRadius: 0 }}>
        Inscrire une Prison
      </Button>
    </GridToolbarContainer>
  );

  const columns = [
    { field: "code", headerName: "CODE", width: 100, renderCell: (p) => <Typography variant="caption" fontWeight={900} sx={{ color: DRC_BLUE }}>{p.value}</Typography> },
    { field: "nom", headerName: "NOM DE L'ÉTABLISSEMENT", flex: 1.5, renderCell: (p) => <Typography variant="body2" fontWeight={800}>{p.value.toUpperCase()}</Typography> },
    { field: "adresse", headerName: "LOCALISATION", flex: 1.5, renderCell: (p) => (
        <Stack direction="row" spacing={1} alignItems="center">
            <LocationOnOutlined sx={{ fontSize: 16, color: DRC_RED }} />
            <Typography variant="caption">{p.value}</Typography>
        </Stack>
    )},
    { field: "capacite", headerName: "CAPACITÉ", width: 120, renderCell: (p) => (
        <Chip label={`${p.value} places`} size="small" sx={{ fontWeight: 900, borderRadius: 0, bgcolor: alpha(DRC_YELLOW, 0.2), color: bc }} />
    )},
    { field: "actions", headerName: "ACTIONS", width: 120, sortable: false, renderCell: (p) => (
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => handleOpenModal(p.row)} sx={{ color: DRC_BLUE }}><EditOutlined fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => handleDelete(p.row.id)} sx={{ color: DRC_RED }}><DeleteSweepOutlined fontSize="small" /></IconButton>
        </Stack>
    )},
  ];

  if (loading && prisons.length === 0) return <Box display="flex" justifyContent="center" p={10}><CircularProgress sx={{ color: DRC_BLUE }} /></Box>;

  return (
    <Box sx={{ p: 4, bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      
      {/* HEADER STYLE INSTITUTIONNEL */}
      <Box sx={{ display: 'flex', height: 4, mb: 1 }}>
        <Box sx={{ flex: 3, bgcolor: DRC_BLUE }} />
        <Box sx={{ flex: 0.5, bgcolor: DRC_YELLOW }} />
        <Box sx={{ flex: 0.5, bgcolor: DRC_RED }} />
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} sx={{ borderBottom: `4px solid ${bc}`, pb: 2 }}>
        <Box>
            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: "-1px" }}>
                CARTOGRAPHIE PÉNITENTIAIRE
            </Typography>
            <Typography variant="caption" fontWeight={800} sx={{ color: DRC_BLUE }}>
                MINISTÈRE DE LA JUSTICE • DIRECTION DES SERVICES PÉNITENTIAIRES
            </Typography>
        </Box>
        <IconButton onClick={fetchPrisons} sx={{ border: `2px solid ${bc}`, borderRadius: 0 }}><Refresh /></IconButton>
      </Box>

      {/* TABLEAU DES DONNÉES */}
      <Paper elevation={0} sx={{ border: `2px solid ${bc}`, borderRadius: 0 }}>
        <Box sx={{ height: 700, width: '100%' }}>
          <DataGrid
            rows={prisons}
            columns={columns}
            localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
            slots={{ toolbar: CustomToolbar }}
            sx={{
                "& .MuiDataGrid-columnHeaders": { bgcolor: alpha(bc, 0.05), borderRadius: 0, fontWeight: 900 },
                "& .MuiDataGrid-cell": { borderBottom: `1px solid ${alpha(bc, 0.1)}` },
                borderRadius: 0, border: "none"
            }}
          />
        </Box>
      </Paper>

      {/* MODAL GESTION (AJOUT/MODIF) */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 0, border: `4px solid ${DRC_BLUE}` } }}>
        <DialogTitle sx={{ bgcolor: bc, color: inv, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={900}>{currentPrison ? "MODIFIER L'ÉTABLISSEMENT" : "INSCRIRE UN NOUVEL ÉTABLISSEMENT"}</Typography>
          <IconButton onClick={() => setOpenModal(false)} sx={{ color: inv }}><CloseOutlined /></IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4, mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={8}>
              <TextField fullWidth label="NOM DE LA PRISON" variant="filled" value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} InputProps={{ startAdornment: <CorporateFareOutlined sx={{mr: 1}} /> }} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="CODE" variant="filled" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} placeholder="KIN-MAK" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="ADRESSE COMPLETE / PROVINCE" variant="filled" value={formData.adresse} onChange={(e) => setFormData({...formData, adresse: e.target.value})} InputProps={{ startAdornment: <LocationOnOutlined sx={{mr: 1}} /> }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="CAPACITÉ D'ACCUEIL" type="number" variant="filled" value={formData.capacite} onChange={(e) => setFormData({...formData, capacite: e.target.value})} InputProps={{ startAdornment: <NumbersOutlined sx={{mr: 1}} /> }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="VILLE (ID)" type="number" variant="filled" value={formData.ville} onChange={(e) => setFormData({...formData, ville: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="DIRECTEUR DE PRISON" variant="filled" value={formData.directeur} onChange={(e) => setFormData({...formData, directeur: e.target.value})} InputProps={{ startAdornment: <SupervisorAccountOutlined sx={{mr: 1}} /> }} />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
                <Button fullWidth variant="contained" onClick={handleSave} startIcon={<SaveOutlined />} sx={{ bgcolor: DRC_BLUE, color: "#fff", py: 2, fontWeight: 900, borderRadius: 0, "&:hover": { bgcolor: "#005bb7" } }}>
                    VALIDER ET ENREGISTRER DANS LA BASE
                </Button>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* TOAST NOTIFICATION */}
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({...toast, open: false})}>
        <Alert severity={toast.severity} variant="filled" sx={{ fontWeight: 900, borderRadius: 0 }}>
          {toast.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default PrisonManager;