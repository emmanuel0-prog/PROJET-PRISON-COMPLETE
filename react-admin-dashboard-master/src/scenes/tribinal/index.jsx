import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box, Typography, useTheme, alpha, Button, Grid, Paper,
  IconButton, Stack, TextField, MenuItem, Dialog, DialogTitle, 
  DialogContent, Snackbar, Alert, Chip, CircularProgress
} from "@mui/material";
import {
  GavelOutlined, AddOutlined, EditOutlined, DeleteSweepOutlined,
  AccountBalanceOutlined, MapOutlined, Refresh, CloseOutlined, SaveOutlined
} from "@mui/icons-material";
import { DataGrid, frFR, GridToolbarQuickFilter, GridToolbarContainer } from "@mui/x-data-grid";
import api from "../../api"; // Import de l'instance axios préconfigurée

// Couleurs Institutionnelles
const DRC_BLUE = "#007FFF";
const DRC_YELLOW = "#F7D618";
const DRC_RED = "#CE1021";
const API_URL = "/tribunaux/";

// Mapping des types pour correspondre aux CHOICES de Django
const TYPES_JURIDICTION = [
  { code: "TRIPAIX", label: "Tribunal de Paix" },
  { code: "TGI", label: "Tribunal de Grande Instance" },
  { code: "COMMERCIAL", label: "Tribunal de Commerce" },
  { code: "TRAVAIL", label: "Tribunal du Travail" },
  { code: "MILITAIRE", label: "Juridiction Militaire" },
  { code: "COUR_APPEL", label: "Cour d'Appel" },
  { code: "COUR_CASSATION", label: "Cour de Cassation" },
];

const TribunalManager = () => {
  const theme = useTheme();
  const bc = theme.palette.mode === "dark" ? "#fff" : "#000";
  const inv = theme.palette.mode === "dark" ? "#000" : "#fff";

  const [tribunaux, setTribunaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [currentTribunal, setCurrentTribunal] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const [formData, setFormData] = useState({
    nom: "", type_juridiction: "", ville: "Kinshasa", commune: "", adresse: ""
  });

  const fetchTribunaux = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_URL);
      setTribunaux(res.data);
    } catch (err) {
      setToast({ open: true, message: "Erreur de liaison avec le serveur API", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTribunaux(); }, []);

  const handleOpenModal = (tribu = null) => {
    if (tribu) {
      setCurrentTribunal(tribu);
      setFormData(tribu);
    } else {
      setCurrentTribunal(null);
      setFormData({ nom: "", type_juridiction: "", ville: "Kinshasa", commune: "", adresse: "" });
    }
    setOpenModal(true);
  };

  const handleSave = async () => {
    // Vérification basique
    if (!formData.nom || !formData.type_juridiction) {
      setToast({ open: true, message: "Le nom et le type sont obligatoires", severity: "warning" });
      return;
    }

    try {
      if (currentTribunal) {
        await api.put(`${API_URL}${currentTribunal.id}/`, formData);
        setToast({ open: true, message: "Fiche mise à jour avec succès", severity: "success" });
      } else {
        await api.post(API_URL, formData);
        setToast({ open: true, message: "Nouvelle juridiction enregistrée", severity: "success" });
      }
      setOpenModal(false);
      fetchTribunaux();
    } catch (err) {
      setToast({ open: true, message: "Erreur d'enregistrement : Vérifiez les données", severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette juridiction ? Cette action est irréversible.")) {
      try {
        await api.delete(`${API_URL}${id}/`);
        fetchTribunaux();
        setToast({ open: true, message: "Juridiction supprimée de l'annuaire", severity: "warning" });
      } catch (err) {
        setToast({ open: true, message: "Erreur lors de la suppression", severity: "error" });
      }
    }
  };

  const CustomToolbar = () => (
    <GridToolbarContainer sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
      <GridToolbarQuickFilter placeholder="Rechercher un tribunal..." sx={{ width: 350 }} />
      <Button 
        variant="contained" 
        startIcon={<AddOutlined />} 
        onClick={() => handleOpenModal()} 
        sx={{ bgcolor: bc, color: inv, fontWeight: 900, borderRadius: 0, px: 3 }}
      >
        Ajouter une Juridiction
      </Button>
    </GridToolbarContainer>
  );

  const columns = [
    { field: "nom", headerName: "NOM DE LA JURIDICTION", flex: 1.5, renderCell: (p) => (
      <Typography variant="body2" fontWeight={800} sx={{ textTransform: 'uppercase' }}>{p.value}</Typography>
    )},
    { field: "type_juridiction", headerName: "TYPE", width: 200, renderCell: (p) => {
      // Trouver le label correspondant au code
      const type = TYPES_JURIDICTION.find(t => t.code === p.value);
      return (
        <Chip 
          label={type ? type.label : p.value} 
          size="small" 
          sx={{ borderRadius: 0, fontWeight: 700, bgcolor: alpha(DRC_BLUE, 0.1), color: DRC_BLUE, border: `1px solid ${alpha(DRC_BLUE, 0.3)}` }} 
        />
      );
    }},
    { field: "ville", headerName: "VILLE", width: 150, renderCell: (p) => (
        <Typography variant="body2" fontWeight={600}>{p.value}</Typography>
    )},
    { field: "commune", headerName: "COMMUNE", width: 150 },
    { field: "actions", headerName: "ACTIONS", width: 120, sortable: false, align: 'center', renderCell: (p) => (
      <Stack direction="row" spacing={1}>
        <IconButton size="small" onClick={() => handleOpenModal(p.row)} sx={{ color: DRC_BLUE, border: `1px solid ${alpha(DRC_BLUE, 0.2)}` }}>
            <EditOutlined fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => handleDelete(p.row.id)} sx={{ color: DRC_RED, border: `1px solid ${alpha(DRC_RED, 0.2)}` }}>
            <DeleteSweepOutlined fontSize="small" />
        </IconButton>
      </Stack>
    )},
  ];

  return (
    <Box sx={{ p: 4, bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      
      {/* BANDEAU DRAPEAU */}
      <Box sx={{ display: 'flex', height: 4, mb: 1 }}>
        <Box sx={{ flex: 3, bgcolor: DRC_BLUE }} />
        <Box sx={{ flex: 0.5, bgcolor: DRC_YELLOW }} />
        <Box sx={{ flex: 0.5, bgcolor: DRC_RED }} />
      </Box>

      {/* HEADER PRINCIPAL */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} sx={{ borderBottom: `4px solid ${bc}`, pb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ display: 'flex', alignItems: 'center', gap: 2, letterSpacing: '-1px' }}>
            <GavelOutlined sx={{ fontSize: 45, color: bc }} /> SYSTÈME JUDICIAIRE (RDC)
          </Typography>
          <Typography variant="caption" fontWeight={800} sx={{ color: DRC_BLUE, letterSpacing: 2, textTransform: 'uppercase' }}>
            Annuaire de la Magistrature • Direction des Extractions
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
            <IconButton onClick={fetchTribunaux} sx={{ border: `2px solid ${bc}`, borderRadius: 0 }}>
                <Refresh />
            </IconButton>
        </Stack>
      </Box>

      {/* ZONE TABLEAU */}
      <Paper elevation={0} sx={{ border: `2px solid ${bc}`, borderRadius: 0, bgcolor: 'background.paper' }}>
        <Box sx={{ height: 650, width: '100%' }}>
          {loading ? (
             <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress sx={{ color: DRC_BLUE }} />
             </Box>
          ) : (
            <DataGrid
                rows={tribunaux}
                columns={columns}
                localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                slots={{ toolbar: CustomToolbar }}
                disableRowSelectionOnClick
                sx={{ 
                    border: "none", 
                    "& .MuiDataGrid-columnHeaders": { bgcolor: alpha(bc, 0.05), borderRadius: 0, borderBottom: `2px solid ${bc}` },
                    "& .MuiDataGrid-cell": { borderBottom: `1px solid ${alpha(bc, 0.1)}` },
                    fontWeight: 500
                }}
            />
          )}
        </Box>
      </Paper>

      {/* MODAL DE SAISIE */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)} 
        fullWidth 
        maxWidth="sm" 
        PaperProps={{ sx: { borderRadius: 0, border: `4px solid ${DRC_RED}`, position: 'relative' } }}
      >
        <DialogTitle sx={{ bgcolor: bc, color: inv, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={900}>FICHE ADMINISTRATIVE DE JURIDICTION</Typography>
          <IconButton onClick={() => setOpenModal(false)} sx={{ color: inv }}><CloseOutlined /></IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4, mt: 2 }}>
          <Stack spacing={3}>
            <TextField 
                fullWidth 
                label="NOM OFFICIEL DE LA JURIDICTION" 
                variant="filled" 
                value={formData.nom} 
                onChange={(e) => setFormData({...formData, nom: e.target.value.toUpperCase()})} 
                InputProps={{ startAdornment: <AccountBalanceOutlined sx={{mr: 1, color: DRC_BLUE}} /> }} 
            />
            
            <TextField 
                select 
                fullWidth 
                label="TYPE DE JURIDICTION" 
                variant="filled" 
                value={formData.type_juridiction} 
                onChange={(e) => setFormData({...formData, type_juridiction: e.target.value})}
            >
              {TYPES_JURIDICTION.map((type) => (
                <MenuItem key={type.code} value={type.code}>
                    <Typography variant="body2" fontWeight={700}>{type.label}</Typography>
                </MenuItem>
              ))}
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth label="VILLE / CHEF-LIEU" variant="filled" value={formData.ville} onChange={(e) => setFormData({...formData, ville: e.target.value})} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="COMMUNE / TERRITOIRE" variant="filled" value={formData.commune} onChange={(e) => setFormData({...formData, commune: e.target.value})} />
              </Grid>
            </Grid>

            <TextField 
                fullWidth 
                multiline 
                rows={2} 
                label="ADRESSE PHYSIQUE COMPLÈTE" 
                variant="filled" 
                value={formData.adresse} 
                onChange={(e) => setFormData({...formData, adresse: e.target.value})} 
                InputProps={{ startAdornment: <MapOutlined sx={{mr: 1, mt: 1, color: DRC_RED}} /> }} 
            />

            <Button 
                fullWidth 
                variant="contained" 
                onClick={handleSave} 
                startIcon={<SaveOutlined />} 
                sx={{ bgcolor: DRC_RED, color: "#fff", py: 2, fontWeight: 900, borderRadius: 0, fontSize: '1rem', "&:hover": { bgcolor: "#a00d1a" } }}
            >
              {currentTribunal ? "METTRE À JOUR LA FICHE" : "ENREGISTRER DANS L'ANNUAIRE"}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* NOTIFICATIONS FLASH */}
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({...toast, open: false})}>
        <Alert severity={toast.severity} variant="filled" sx={{ fontWeight: 900, borderRadius: 0, width: '100%' }}>
            {toast.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default TribunalManager;