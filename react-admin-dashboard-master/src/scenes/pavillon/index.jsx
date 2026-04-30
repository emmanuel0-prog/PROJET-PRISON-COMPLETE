import React, { useState, useEffect } from "react";
import {
  Box, Typography, useTheme, alpha, Button, Grid, Paper,
  TextField, MenuItem, Stack, Snackbar, Alert, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  CircularProgress, Tooltip, Avatar
} from "@mui/material";

import {
  AddHomeWorkOutlined, DeleteOutline, EditOutlined, 
  ShieldOutlined, FilterAltOutlined, HistoryOutlined, 
  RestoreFromTrash, DomainOutlined, Inventory2Outlined
} from "@mui/icons-material";

// ✅ IMPORT UNIQUE DE TON API CENTRALISÉ
import api from "../../api";

// COULEURS
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1021";
const DEEP_NAVY = "#050B14";

const TYPE_ZONE_CHOICES = [
  { value: "HAUTE_SECURITE", label: "Haute Sécurité (Dangerosité Élevée)" },
  { value: "NORMAL", label: "Zone Standard / Régime Normal" },
];

const PavillonDashboard = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // --- ÉTATS ---
  const [pavillons, setPavillons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("active");

  const [openModal, setOpenModal] = useState(false);
  const [selectedPavillon, setSelectedPavillon] = useState(null);

  const [form, setForm] = useState({
    nom: "",
    type_zone: "NORMAL",
    description: ""
  });

  const [historyModal, setHistoryModal] = useState({ open: false, data: [] });
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", type: "success" });

  // --- UTIL ---
  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, msg, type });
  };

  // --- CHARGEMENT ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const url = view === "active" 
        ? "/pavillons/" 
        : "/pavillons/corbeille/";

      const res = await api.get(url);
      setPavillons(res.data);

    } catch (err) {
      showMsg("Erreur de connexion au serveur", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [view]);

  // --- MODAL ---
  const handleOpenModal = (pav = null) => {
    if (pav) {
      setSelectedPavillon(pav);
      setForm({
        nom: pav.nom,
        type_zone: pav.type_zone,
        description: pav.description
      });
    } else {
      setSelectedPavillon(null);
      setForm({
        nom: "",
        type_zone: "NORMAL",
        description: ""
      });
    }
    setOpenModal(true);
  };

  // --- SAVE ---
  const handleSave = async () => {
    try {
      if (selectedPavillon) {
        await api.put(`/pavillons/${selectedPavillon.id}/`, form);
        showMsg("Pavillon mis à jour avec archivage de l'état ancien");
      } else {
        await api.post("/pavillons/", form);
        showMsg("Nouveau pavillon opérationnel");
      }

      setOpenModal(false);
      fetchData();

    } catch (err) {
      showMsg("Échec de l'opération", "error");
    }
  };

  // --- DELETE ---
  const handleDelete = async (id) => {
    if (window.confirm("Déplacer ce pavillon vers la corbeille ?")) {
      try {
        await api.delete(`/pavillons/${id}/`);
        showMsg("Pavillon désactivé (Corbeille)", "info");
        fetchData();
      } catch (err) {
        showMsg("Erreur de suppression", "error");
      }
    }
  };

  // --- RESTORE ---
  const handleRestore = async (id) => {
    try {
      await api.post(`/pavillons/${id}/restaurer/`);
      showMsg("Pavillon restauré dans le secteur actif", "success");
      fetchData();
    } catch (err) {
      showMsg("Erreur de restauration", "error");
    }
  };

  // --- HISTORY ---
  const fetchHistory = async (id) => {
    try {
      const res = await api.get(`/pavillons/${id}/historique/`);
      setHistoryModal({ open: true, data: res.data });
    } catch (err) {
      showMsg("Impossible de charger l'historique", "error");
    }
  };

  // --- RENDU STAT BOXES ---
  const StatBox = ({ label, value, color, icon }) => (
    <Paper sx={{ p: 2, bgcolor: alpha(color, 0.05), borderLeft: `4px solid ${color}`, borderRadius: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="caption" fontWeight={800} sx={{ color, textTransform: "uppercase" }}>{label}</Typography>
          <Typography variant="h4" fontWeight={900}>{value}</Typography>
        </Box>
        <Avatar sx={{ bgcolor: color }}>{icon}</Avatar>
      </Stack>
    </Paper>
  );

  return (
    <Box sx={{ p: 4, minHeight: "100vh", bgcolor: isDark ? DEEP_NAVY : "#f5f7fa" }}>
      
      {/* HEADER SECTION */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} color={RDC_BLUE}>SISTEM-ZONES <span style={{color: RDC_YELLOW}}>V3</span></Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>Gestion des infrastructures et pavillons pénitentiaires</Typography>
        </Box>
        <Button 
          variant="contained" 
          onClick={() => handleOpenModal()} 
          startIcon={<AddHomeWorkOutlined />}
          sx={{ bgcolor: RDC_BLUE, borderRadius: 0, fontWeight: 900, px: 3 }}
        >
          AJOUTER UN PAVILLON
        </Button>
      </Stack>

      {/* QUICK STATS */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}><StatBox label="Unités Actives" value={view === "active" ? pavillons.length : "--"} color={RDC_BLUE} icon={<DomainOutlined />} /></Grid>
        <Grid item xs={12} md={6}><StatBox label="Zone Haute Sécurité" value={pavillons.filter(p => p.type_zone === 'HAUTE_SECURITE').length} color={RDC_RED} icon={<ShieldOutlined />} /></Grid>
      </Grid>

      {/* TABS VIEW */}
      <Stack direction="row" spacing={2} mb={2}>
        <Button 
          variant={view === "active" ? "contained" : "text"} 
          sx={{ borderRadius: 0, fontWeight: 800, bgcolor: view === "active" ? alpha(RDC_BLUE, 0.9) : "transparent" }}
          onClick={() => setView("active")}
        >
          SECTEURS ACTIFS
        </Button>
        <Button 
          variant={view === "corbeille" ? "contained" : "text"} 
          color="error"
          startIcon={<Inventory2Outlined />}
          sx={{ borderRadius: 0, fontWeight: 800 }}
          onClick={() => setView("corbeille")}
        >
          CORBEILLE / INACTIFS
        </Button>
      </Stack>

      {/* TABLEAU PRINCIPAL */}
      <Paper sx={{ borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, overflow: "hidden" }}>
        <Box sx={{ p: 2, bgcolor: view === "corbeille" ? alpha(RDC_RED, 0.05) : alpha(RDC_BLUE, 0.05), borderBottom: `1px solid ${alpha(view === "corbeille" ? RDC_RED : RDC_BLUE, 0.2)}` }}>
            <Stack direction="row" spacing={2} alignItems="center">
                <FilterAltOutlined />
                <Typography variant="subtitle2" fontWeight={900}>
                  {view === "corbeille" ? "LISTE DES PAVILLONS SUPPRIMÉS" : "LISTE DES PAVILLONS EN SERVICE"}
                </Typography>
            </Stack>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: isDark ? "#000" : "#f1f1f1" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 900 }}>NOM DU PAVILLON</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>TYPE DE ZONE</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>DESCRIPTION / NOTES</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={24} /></TableCell></TableRow>
              ) : pavillons.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center"><Typography variant="body2" sx={{py: 3, opacity: 0.6}}>Aucune donnée enregistrée.</Typography></TableCell></TableRow>
              ) : pavillons.map((pav) => (
                <TableRow key={pav.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={800}>{pav.nom}</Typography>
                    <Typography variant="caption" sx={{ color: RDC_BLUE }}>ID: #00{pav.id}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={pav.type_zone_label} 
                      size="small" 
                      sx={{ 
                        fontWeight: 900, 
                        borderRadius: 0, 
                        bgcolor: pav.type_zone === 'HAUTE_SECURITE' ? alpha(RDC_RED, 0.1) : alpha(RDC_BLUE, 0.1),
                        color: pav.type_zone === 'HAUTE_SECURITE' ? RDC_RED : RDC_BLUE,
                        border: `1px solid ${pav.type_zone === 'HAUTE_SECURITE' ? RDC_RED : RDC_BLUE}`
                      }} 
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography variant="caption" sx={{ fontStyle: "italic" }}>{pav.description || "Aucun détail technique."}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {view === "corbeille" ? (
                        <Button size="small" variant="outlined" color="success" onClick={() => handleRestore(pav.id)} startIcon={<RestoreFromTrash />} sx={{ borderRadius: 0 }}>
                          RESTAURER
                        </Button>
                      ) : (
                        <>
                          <Tooltip title="Historique des changements"><IconButton size="small" onClick={() => fetchHistory(pav.id)}><HistoryOutlined color="info" /></IconButton></Tooltip>
                          <Tooltip title="Modifier"><IconButton size="small" onClick={() => handleOpenModal(pav)}><EditOutlined color="primary" /></IconButton></Tooltip>
                          <Tooltip title="Supprimer"><IconButton size="small" onClick={() => handleDelete(pav.id)}><DeleteOutline color="error" /></IconButton></Tooltip>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* MODAL HISTORIQUE (AUDIT TRAIL) */}
      <Dialog open={historyModal.open} onClose={() => setHistoryModal({ ...historyModal, open: false })} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ fontWeight: 900, borderBottom: `2px solid ${RDC_BLUE}`, display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryOutlined /> LOG DE MODIFICATION INFRASTRUCTURE
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: alpha(RDC_BLUE, 0.05) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>DATE</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>ACTION</TableCell>
                <TableCell sx={{ fontWeight: 800, color: RDC_RED }}>ÉTAT ANCIEN</TableCell>
                <TableCell sx={{ fontWeight: 800, color: RDC_BLUE }}>ÉTAT ACTUEL</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historyModal.data.map((h, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ fontSize: "0.75rem" }}>{new Date(h.date_modification).toLocaleString()}</TableCell>
                  <TableCell><Chip label={h.action} size="small" sx={{ borderRadius: 0, fontSize: "0.6rem" }} /></TableCell>
                  <TableCell sx={{ fontSize: "0.75rem", opacity: 0.7 }}>{JSON.stringify(h.etat_ancien)}</TableCell>
                  <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700 }}>{JSON.stringify(h.etat_actuel)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setHistoryModal({ ...historyModal, open: false })} variant="contained" sx={{ bgcolor: DEEP_NAVY, borderRadius: 0 }}>FERMER</Button></DialogActions>
      </Dialog>

      {/* MODAL AJOUT / EDIT */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ fontWeight: 900, borderBottom: `2px solid ${RDC_BLUE}` }}>
          {selectedPavillon ? "MISE À JOUR UNITÉ" : "NOUVELLE INFRASTRUCTURE"}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={3} mt={1}>
            <TextField fullWidth label="NOM DU PAVILLON" value={form.nom} onChange={(e) => setForm({...form, nom: e.target.value})} variant="filled" />
            <TextField select fullWidth label="TYPE DE ZONE" value={form.type_zone} onChange={(e) => setForm({...form, type_zone: e.target.value})} variant="filled">
              {TYPE_ZONE_CHOICES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
            </TextField>
            <TextField fullWidth multiline rows={3} label="DESCRIPTION TECHNIQUE" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} variant="filled" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenModal(false)} sx={{ fontWeight: 900, color: "gray" }}>ANNULER</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: RDC_BLUE, fontWeight: 900, px: 4, borderRadius: 0 }}>
            {selectedPavillon ? "CONFIRMER LES CHANGEMENTS" : "INITIALISER LE PAVILLON"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.type} variant="filled" sx={{ fontWeight: 900, borderRadius: 0 }}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PavillonDashboard;