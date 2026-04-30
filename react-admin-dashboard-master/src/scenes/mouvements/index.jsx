import React, { useState, useEffect, useCallback } from "react";

// ❌ SUPPRIMÉ : axios
// import axios from "axios";

import {
  Box, Typography, alpha, Button, Grid, Paper, TextField, MenuItem, 
  Stack, Snackbar, Alert, IconButton, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, 
  DialogContent, DialogActions, Chip, CircularProgress, Avatar, 
  Tooltip, useTheme, Fade, Zoom, Badge
} from "@mui/material";

import {
  EditOutlined, DeleteOutline, HistoryOutlined, 
  RestoreFromTrash, LocalShippingOutlined, 
  RefreshOutlined, ShieldOutlined, GavelOutlined,
  CompareArrowsOutlined, VerifiedUserOutlined,
  ExitToAppOutlined, AssignmentTurnedInOutlined
} from "@mui/icons-material";

// ✅ API CENTRALISÉ
import api from "../../api";

// Assets
import sceauRdc from "../../assets/gouvernement rdc.png";
import drapeauRdc from "../../assets/rdc.png";

const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1021";

const GestionMouvementsExterieurs = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const bgColor = isDark ? "#020617" : "#F1F5F9";
  const paperBg = isDark ? alpha("#0F172A", 0.9) : "#FFFFFF";
  const glowEffect = isDark ? `0 0 20px ${alpha(RDC_BLUE, 0.2)}` : `0 10px 30px ${alpha(RDC_BLUE, 0.08)}`;
  const borderColor = alpha(RDC_BLUE, 0.15);

  // --- ÉTATS ---
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("active");
  const [editModal, setEditModal] = useState({ open: false, data: null });
  const [historyModal, setHistoryModal] = useState({ open: false, logs: [], target: "" });
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", type: "success" });

  // --- ENDPOINTS PROPRES ---
  const BASE = "/mouvements-exterieurs";

  // --- CHARGEMENT ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = view === "active"
        ? `${BASE}/mouvements-actifs/`
        : `${BASE}/corbeille/`;

      const res = await api.get(endpoint);
      setMouvements(res.data);

    } catch (err) {
      setSnackbar({ open: true, msg: "Échec de connexion au terminal central DGSP", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- UPDATE ---
  const handleUpdate = async () => {
    try {
      await api.put(`${BASE}/${editModal.data.id}/`, editModal.data);
      setEditModal({ open: false, data: null });
      fetchData();
      setSnackbar({ open: true, msg: "Protocole de mouvement mis à jour", type: "success" });
    } catch (err) {
      setSnackbar({ open: true, msg: "Erreur de validation des données", type: "error" });
    }
  };

  // --- DELETE ---
  const handleDelete = async (id) => {
    if (!window.confirm("Archiver ce mouvement dans la zone sécurisée ?")) return;

    try {
      await api.delete(`${BASE}/${id}/`);
      fetchData();
      setSnackbar({ open: true, msg: "Mouvement déplacé vers les archives", type: "warning" });
    } catch (err) {
      setSnackbar({ open: true, msg: "Erreur lors de l'archivage", type: "error" });
    }
  };

  // --- RESTORE ---
  const handleRestore = async (id) => {
    try {
      await api.post(`${BASE}/${id}/restaurer/`);
      fetchData();
      setSnackbar({ open: true, msg: "Réactivation du mouvement réussie", type: "success" });
    } catch (err) {
      setSnackbar({ open: true, msg: "Échec de la restauration", type: "error" });
    }
  };

  // --- HISTORIQUE ---
  const openHistory = async (mov) => {
    try {
      const res = await api.get(`${BASE}/${mov.id}/historique/`);
      setHistoryModal({
        open: true,
        logs: res.data,
        target: `${mov.nom_detenu} ${mov.prenom_detenu}`
      });
    } catch (err) {
      setSnackbar({ open: true, msg: "Accès à l'audit refusé", type: "error" });
    }
  };

  // --- UI : CARTE STATS ---
  const StatCard = ({ label, value, color, icon }) => (
    <Paper sx={{ p: 2, bgcolor: paperBg, borderLeft: `5px solid ${color}`, borderRadius: 2, border: `1px solid ${borderColor}`, boxShadow: glowEffect }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar sx={{ bgcolor: alpha(color, 0.1), color, width: 50, height: 50 }}>{icon}</Avatar>
        <Box>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1 }}>{label}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, color }}>{value}</Typography>
        </Box>
      </Stack>
    </Paper>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: bgColor }}>
      
      {/* HEADER MINISTÉRIEL */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: paperBg, border: `1px solid ${borderColor}`, borderRadius: 3, boxShadow: glowEffect }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar src={sceauRdc} sx={{ width: 80, height: 80, border: `2px solid ${RDC_YELLOW}` }} />
            <Box>
              <Typography variant="overline" sx={{ color: RDC_RED, fontWeight: 900, letterSpacing: 2 }}>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: RDC_BLUE, textShadow: isDark ? `0 0 10px ${alpha(RDC_BLUE, 0.5)}` : "none" }}>SISTEM-MOV EXTERIEUR</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
                <VerifiedUserOutlined fontSize="small" /> Surveillance des Détenus Hors Murs - Flux Temps Réel
              </Typography>
            </Box>
          </Stack>
          <Box component="img" src={drapeauRdc} sx={{ height: 60, borderRadius: 1, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" }} />
        </Stack>
      </Paper>

      {/* TOOLBAR CONTROLS */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Stack direction="row" spacing={2}>
          <Button 
            variant={view === "active" ? "contained" : "outlined"}
            startIcon={<ExitToAppOutlined />}
            onClick={() => setView("active")}
            sx={{ borderRadius: 2, fontWeight: 900, px: 3, bgcolor: view === "active" ? RDC_BLUE : "transparent" }}
          >
            FLUX ACTIFS
          </Button>
          <Button 
            variant={view === "corbeille" ? "contained" : "outlined"}
            startIcon={<HistoryOutlined />}
            onClick={() => setView("corbeille")}
            sx={{ borderRadius: 2, fontWeight: 900, px: 3, bgcolor: view === "corbeille" ? RDC_RED : "transparent", color: view === "corbeille" ? "#fff" : RDC_RED, borderColor: RDC_RED }}
          >
            ARCHIVES & LOGS
          </Button>
        </Stack>
        <Typography variant="h6" sx={{ fontWeight: 900, color: "text.primary", fontFamily: "monospace" }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
        </Typography>
      </Stack>

      {/* STATS AREA */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}><StatCard label="HORS MURS" value={mouvements.length} color={RDC_BLUE} icon={<LocalShippingOutlined />} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="VERS TRIBUNAUX" value={mouvements.filter(m => m.destination === 'TRIBUNAL').length} color={RDC_YELLOW} icon={<GavelOutlined />} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="ESCORTES ACTIVES" value={new Set(mouvements.map(m => m.escorte)).size} color="#4caf50" icon={<ShieldOutlined />} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="SÉCURITÉ" value="FORCE-MAX" color={RDC_RED} icon={<VerifiedUserOutlined />} /></Grid>
      </Grid>

      {/* MAIN TABLE */}
      <TableContainer component={Paper} sx={{ bgcolor: paperBg, borderRadius: 3, border: `1px solid ${borderColor}`, boxShadow: glowEffect, overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ bgcolor: alpha(RDC_BLUE, 0.05) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 900, color: RDC_BLUE }}>DÉTENU / MATRICULE</TableCell>
              <TableCell sx={{ fontWeight: 900, color: RDC_BLUE }}>DESTINATION & MOTIF</TableCell>
              <TableCell sx={{ fontWeight: 900, color: RDC_BLUE }}>PROTOCOLE SORTIE</TableCell>
              <TableCell sx={{ fontWeight: 900, color: RDC_BLUE }}>ESCORTE</TableCell>
              <TableCell align="right" sx={{ fontWeight: 900, color: RDC_BLUE }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}><CircularProgress sx={{ color: RDC_YELLOW }} /></TableCell></TableRow>
            ) : mouvements.map((mov) => (
              <TableRow key={mov.id} hover sx={{ transition: "0.2s" }}>
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot" color={mov.statut === 'HORS MURS' ? "error" : "success"}>
                      <Avatar src={mov.photo_detenu} sx={{ width: 45, height: 45, border: `2px solid ${borderColor}` }} />
                    </Badge>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 800 }}>{mov.nom_detenu} {mov.prenom_detenu}</Typography>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>{mov.matricule_detenu}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={mov.destination} size="small" sx={{ mb: 1, fontWeight: 900, bgcolor: alpha(RDC_YELLOW, 0.1), color: "#B59A00" }} />
                  <Typography variant="body2" sx={{ maxWidth: 250, opacity: 0.8 }}>{mov.motif_details}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{new Date(mov.heure_sortie).toLocaleString('fr-FR')}</Typography>
                  <Stack direction="row" spacing={1} mt={0.5}>
                    {mov.mandat_verifie && <Tooltip title="Mandat OK"><AssignmentTurnedInOutlined sx={{ fontSize: 16, color: "#4caf50" }} /></Tooltip>}
                    {mov.ordre_mission_verifie && <Tooltip title="Ordre Mission OK"><VerifiedUserOutlined sx={{ fontSize: 16, color: RDC_BLUE }} /></Tooltip>}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{mov.escorte}</Typography>
                </TableCell>
                <TableCell align="right">
                  {view === "active" ? (
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton onClick={() => openHistory(mov)} sx={{ color: RDC_YELLOW, bgcolor: alpha(RDC_YELLOW, 0.1) }}><HistoryOutlined /></IconButton>
                      <IconButton onClick={() => setEditModal({ open: true, data: mov })} sx={{ color: RDC_BLUE, bgcolor: alpha(RDC_BLUE, 0.1) }}><EditOutlined /></IconButton>
                      <IconButton onClick={() => handleDelete(mov.id)} sx={{ color: RDC_RED, bgcolor: alpha(RDC_RED, 0.1) }}><DeleteOutline /></IconButton>
                    </Stack>
                  ) : (
                    <Button startIcon={<RestoreFromTrash />} variant="contained" size="small" onClick={() => handleRestore(mov.id)} sx={{ bgcolor: RDC_BLUE, fontWeight: 900 }}>
                      RÉACTIVER
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODALE D'ÉDITION (MODIFICATION PROTOCOLE) */}
      <Dialog open={editModal.open} onClose={() => setEditModal({ open: false, data: null })} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: paperBg, borderRadius: 3, borderTop: `6px solid ${RDC_BLUE}` } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>MISE À JOUR DU MOUVEMENT</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editModal.data && (
            <Stack spacing={3} sx={{ mt: 1 }}>
               <TextField fullWidth label="AGENT D'ESCORTE" value={editModal.data.escorte} onChange={(e) => setEditModal({...editModal, data: {...editModal.data, escorte: e.target.value}})} variant="filled" />
               <TextField fullWidth multiline rows={3} label="DÉTAILS DU MOTIF" value={editModal.data.motif_details} onChange={(e) => setEditModal({...editModal, data: {...editModal.data, motif_details: e.target.value}})} variant="filled" />
               <Stack direction="row" spacing={2}>
                  <TextField select fullWidth label="STATUT" value={editModal.data.statut} onChange={(e) => setEditModal({...editModal, data: {...editModal.data, statut: e.target.value}})} variant="filled">
                    <MenuItem value="HORS MURS">HORS MURS</MenuItem>
                    <MenuItem value="RETOURNE">REINTEGRÉ</MenuItem>
                  </TextField>
               </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditModal({ open: false, data: null })} sx={{ color: "text.secondary", fontWeight: 900 }}>ANNULER</Button>
          <Button onClick={handleUpdate} variant="contained" sx={{ bgcolor: RDC_BLUE, fontWeight: 900, px: 4 }}>ENREGISTRER</Button>
        </DialogActions>
      </Dialog>

   {/* MODALE HISTORIQUE (COMPARAISON D'ÉTATS DYNAMIQUE) */}
<Dialog 
  TransitionComponent={Zoom} 
  open={historyModal.open} 
  onClose={() => setHistoryModal({ ...historyModal, open: false })} 
  fullWidth 
  maxWidth="md" 
  PaperProps={{ sx: { bgcolor: paperBg, borderRadius: 3, borderTop: `6px solid ${RDC_YELLOW}` } }}
>
  <DialogTitle sx={{ borderBottom: `1px solid ${borderColor}`, pb: 2 }}>
    <Stack direction="row" spacing={2} alignItems="center">
      <HistoryOutlined sx={{ color: RDC_YELLOW, fontSize: 35 }} />
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 900 }}>AUDIT DE SÉCURITÉ CIBLÉ</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>TRACABILITÉ : {historyModal.target}</Typography>
      </Box>
    </Stack>
  </DialogTitle>

  <DialogContent sx={{ p: 3 }}>
    <Stack spacing={3} sx={{ mt: 1 }}>
      {historyModal.logs.length === 0 ? (
        <Alert severity="info">Aucune modification historique sur ce flux.</Alert>
      ) : (
        historyModal.logs.map((log, index) => (
          <Paper key={index} elevation={0} sx={{ p: 2, bgcolor: alpha(bgColor, 0.5), border: `1px solid ${borderColor}`, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" mb={2}>
              <Chip 
                label={log.action} 
                size="small" 
                sx={{ fontWeight: 900, bgcolor: log.action === 'UPDATE' ? RDC_YELLOW : RDC_BLUE, color: "#000" }} 
              />
              <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                {new Date(log.date_modification).toLocaleString()} par {log.modifie_par_nom || "SYSTÈME"}
              </Typography>
            </Stack>

            {/* --- DÉBUT DU BLOC DE COMPARAISON INTELLIGENTE --- */}
            {log.action === 'UPDATE' && log.etat_ancien ? (
              <Grid container spacing={2}>
                {Object.keys(log.etat_actuel).map((key) => {
                  // On ignore les champs techniques
                  if (['id', 'detenu', 'deleted_at', 'is_deleted', 'photo_detenu'].includes(key)) return null;

                  // On compare l'ancien et le nouveau
                  const valAncienne = log.etat_ancien[key];
                  const valActuelle = log.etat_actuel[key];

                  if (JSON.stringify(valAncienne) !== JSON.stringify(valActuelle)) {
                    const labels = {
                      escorte: "AGENT D'ESCORTE",
                      statut: "STATUT DU FLUX",
                      motif_details: "MOTIF / DOSSIER",
                      destination: "DESTINATION",
                      heure_sortie: "HEURE DÉPART",
                      heure_retour: "HEURE RETOUR"
                    };

                    return (
                      <Grid item xs={12} key={key}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: RDC_BLUE }}>
                          MODIFICATION : {labels[key] || key.toUpperCase()}
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                          <Box sx={{ flex: 1, p: 1, bgcolor: alpha(RDC_RED, 0.05), borderLeft: `3px solid ${RDC_RED}`, borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.7rem', color: RDC_RED }}>ANCIEN</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{valAncienne?.toString() || "N/A"}</Typography>
                          </Box>
                          <CompareArrowsOutlined sx={{ color: "text.disabled", fontSize: 18 }} />
                          <Box sx={{ flex: 1, p: 1, bgcolor: alpha("#4caf50", 0.05), borderLeft: `3px solid #4caf50`, borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.7rem', color: "#4caf50" }}>ACTUEL</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{valActuelle?.toString() || "N/A"}</Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    );
                  }
                  return null;
                })}
              </Grid>
            ) : (
              <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
                {log.action === 'CREATE' ? "Initialisation du mouvement dans le registre." : "Action d'archivage/restauration."}
              </Typography>
            )}
            {/* --- FIN DU BLOC DE COMPARAISON --- */}
          </Paper>
        ))
      )}
    </Stack>
  </DialogContent>

  <DialogActions sx={{ p: 2, borderTop: `1px solid ${borderColor}` }}>
    <Button onClick={() => setHistoryModal({ ...historyModal, open: false })} variant="outlined" sx={{ fontWeight: 900, borderRadius: 2 }}>
      FERMER L'AUDIT
    </Button>
  </DialogActions>
</Dialog>
      {/* NOTIFICATIONS */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.type} variant="filled" sx={{ fontWeight: 900, borderRadius: 2 }}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default GestionMouvementsExterieurs;