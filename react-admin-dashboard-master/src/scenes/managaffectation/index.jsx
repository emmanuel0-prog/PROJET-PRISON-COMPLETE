import React, { useState, useEffect, useCallback } from "react";

import {
  Box, Typography, alpha, Button, Grid, Paper, TextField, MenuItem, 
  Stack, Snackbar, Alert, IconButton, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, 
  DialogContent, DialogActions, Chip, CircularProgress, Avatar, 
  Tooltip, useTheme, Fade, Zoom
} from "@mui/material";

import {
  EditOutlined, DeleteOutline, HistoryOutlined, 
  RestoreFromTrash, SwapHorizOutlined, 
  RefreshOutlined, ShieldOutlined, GavelOutlined,
  CompareArrowsOutlined, VerifiedUserOutlined
} from "@mui/icons-material";

// ✅ API CENTRALISÉ
import api from "../../api";

// Assets
import sceauRdc from "../../assets/gouvernement rdc.png";
import drapeauRdc from "../../assets/rdc.png";

// Couleurs
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1021";

const GestionAffectations = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const bgColor = isDark ? "#03070E" : "#F8F9FA";
  const paperBg = isDark ? alpha("#0A1929", 0.8) : "#FFFFFF";
  const textColor = isDark ? "#E2E8F0" : "#1E293B";
  const textMuted = isDark ? "#94A3B8" : "#64748B";
  const borderColor = isDark ? alpha(RDC_BLUE, 0.2) : alpha(RDC_BLUE, 0.1);
  const glowEffect = isDark
    ? `0 0 15px ${alpha(RDC_BLUE, 0.3)}`
    : `0 4px 20px ${alpha(RDC_BLUE, 0.1)}`;

  // --- ÉTATS ---
  const [affectations, setAffectations] = useState([]);
  const [cellules, setCellules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("active");

  const [editModal, setEditModal] = useState({ open: false, data: null });
  const [historyModal, setHistoryModal] = useState({ open: false, logs: [], target: "" });

  const [snackbar, setSnackbar] = useState({ open: false, msg: "", type: "success" });

  // --- HELPER ---
  const getCellNumero = (id) => {
    if (!id) return "N/A";
    const cell = cellules.find(c => c.id === id);
    return cell ? cell.numero : `ID: ${id}`;
  };

  // ================================
  // FETCH DATA
  // ================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint =
        view === "active"
          ? "/affectations/"
          : "/affectations/corbeille/";

      const [resAff, resCell] = await Promise.all([
        api.get(endpoint),
        api.get("/cellules/")
      ]);

      setAffectations(resAff.data);
      setCellules(resCell.data);

    } catch (err) {
      setSnackbar({
        open: true,
        msg: "Erreur de liaison avec le serveur DGSP",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================================
  // UPDATE
  // ================================
  const handleUpdate = async () => {
    try {
      await api.put(`/affectations/${editModal.data.id}/`, editModal.data);

      setEditModal({ open: false, data: null });
      fetchData();

      setSnackbar({
        open: true,
        msg: "Mise à jour sécurisée enregistrée",
        type: "success"
      });

    } catch (err) {
      const errorMsg = err.response?.data
        ? JSON.stringify(err.response.data)
        : "Contrainte de sécurité violée";

      setSnackbar({
        open: true,
        msg: `Échec: ${errorMsg}`,
        type: "error"
      });
    }
  };

  // ================================
  // DELETE
  // ================================
  const handleDelete = async (id) => {
    try {
      await api.delete(`/affectations/${id}/`);
      fetchData();

      setSnackbar({
        open: true,
        msg: "Affectation transférée en zone d'archives",
        type: "warning"
      });

    } catch (err) {
      setSnackbar({
        open: true,
        msg: "Erreur de suppression",
        type: "error"
      });
    }
  };

  // ================================
  // RESTORE
  // ================================
  const handleRestore = async (id) => {
    try {
      await api.post(`/affectations/${id}/restaurer/`);
      fetchData();

      setSnackbar({
        open: true,
        msg: "Restauration dans le registre actif",
        type: "success"
      });

    } catch (err) {
      setSnackbar({
        open: true,
        msg: "Impossible de restaurer l'élément",
        type: "error"
      });
    }
  };

  // ================================
  // HISTORIQUE
  // ================================
  const openHistory = async (aff) => {
    try {
      const res = await api.get(`/affectations/${aff.id}/historique/`);

      setHistoryModal({
        open: true,
        logs: res.data,
        target: aff.detenu_nom
      });

    } catch (err) {
      setSnackbar({
        open: true,
        msg: "Accès à l'historique refusé ou indisponible",
        type: "error"
      });
    }
  };

  // --- UI COMPONENTS ---
  const StatCard = ({ label, value, color, icon }) => (
    <Paper sx={{ p: 3, bgcolor: paperBg, borderLeft: `4px solid ${color}`, borderRadius: 1, border: `1px solid ${borderColor}`, boxShadow: glowEffect, transition: "0.3s", "&:hover": { transform: "translateY(-5px)" }}}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar sx={{ bgcolor: alpha(color, 0.1), color, width: 56, height: 56 }}>{icon}</Avatar>
        <Box>
          <Typography variant="caption" fontWeight={800} sx={{ color: textMuted, letterSpacing: 1 }}>{label}</Typography>
          <Typography variant="h4" fontWeight={900} sx={{ color }}>{value}</Typography>
        </Box>
      </Stack>
    </Paper>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: bgColor, color: textColor }}>
      
      {/* HEADER MINISTÉRIEL */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: paperBg, border: `1px solid ${borderColor}`, borderRadius: 2, boxShadow: glowEffect }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Box sx={{ p: 1, borderRadius: "50%", border: `2px dashed ${RDC_YELLOW}`, bgcolor: isDark ? "#fff" : "transparent" }}>
              <Avatar src={sceauRdc} sx={{ width: 70, height: 70 }} />
            </Box>
            <Box>
              <Typography variant="overline" sx={{ color: RDC_RED, fontWeight: 900, letterSpacing: 2 }}>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, textTransform: "uppercase", color: RDC_BLUE }}>Direction Générale des Services Pénitentiaires</Typography>
              <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                <VerifiedUserOutlined sx={{ fontSize: 18, color: RDC_YELLOW }} />
                <Typography variant="body2" sx={{ color: textMuted, fontWeight: 600, letterSpacing: 1 }}>Réseau Sécurisé - Gestion des Mouvements</Typography>
              </Stack>
            </Box>
          </Stack>
          <Box component="img" src={drapeauRdc} sx={{ height: 50, borderRadius: 1, boxShadow: 3 }} />
        </Stack>
      </Paper>

      {/* TOOLBAR */}
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" mb={4} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            SISTEM-AFFECT <Chip label="PRO" size="small" sx={{ bgcolor: RDC_YELLOW, color: "#000", fontWeight: 900, borderRadius: 1 }} />
          </Typography>
        </Box>
        <Button 
          variant={view === "active" ? "outlined" : "contained"} 
          startIcon={view === "active" ? <DeleteOutline /> : <RefreshOutlined />}
          onClick={() => setView(view === "active" ? "corbeille" : "active")}
          sx={{ 
            borderRadius: 1, 
            color: view === "active" ? RDC_RED : "#fff", 
            borderColor: view === "active" ? RDC_RED : "transparent",
            bgcolor: view === "active" ? "transparent" : RDC_BLUE,
            fontWeight: "bold"
          }}
        >
          {view === "active" ? "ARCHIVES & CORBEILLE" : "RETOUR AU REGISTRE ACTIF"}
        </Button>
      </Stack>

      {/* STATS AREA */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}><StatCard label="AFFECTATIONS ACTIVES" value={view === "active" ? affectations.length : "..."} color={RDC_BLUE} icon={<SwapHorizOutlined fontSize="large" />} /></Grid>
        <Grid item xs={12} md={4}><StatCard label="ZONES OCCUPÉES" value={cellules.length} color={RDC_YELLOW} icon={<GavelOutlined fontSize="large" />} /></Grid>
        <Grid item xs={12} md={4}><StatCard label="NIVEAU SÉCURITÉ" value="MAXIMUM" color={RDC_RED} icon={<ShieldOutlined fontSize="large" />} /></Grid>
      </Grid>

      {/* MAIN TABLE */}
      <TableContainer component={Paper} sx={{ bgcolor: paperBg, borderRadius: 2, border: `1px solid ${borderColor}`, boxShadow: glowEffect, overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ bgcolor: alpha(RDC_BLUE, isDark ? 0.2 : 0.05) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 900, color: isDark ? "#fff" : RDC_BLUE }}>IDENTITÉ DU DÉTENU</TableCell>
              <TableCell sx={{ fontWeight: 900, color: isDark ? "#fff" : RDC_BLUE }}>LOCALISATION</TableCell>
              <TableCell sx={{ fontWeight: 900, color: isDark ? "#fff" : RDC_BLUE }}>DATE D'ENTRÉE</TableCell>
              <TableCell sx={{ fontWeight: 900, color: isDark ? "#fff" : RDC_BLUE }}>MOTIF</TableCell>
              <TableCell align="right" sx={{ fontWeight: 900, color: isDark ? "#fff" : RDC_BLUE }}>COMMANDES</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}><CircularProgress sx={{ color: RDC_YELLOW }} /></TableCell></TableRow>
            ) : affectations.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5, color: textMuted, fontWeight: "bold" }}>BASE DE DONNÉES VIDE</TableCell></TableRow>
            ) : affectations.map((aff) => (
              <TableRow key={aff.id} sx={{ "&:hover": { bgcolor: alpha(RDC_BLUE, 0.05) }, transition: "0.2s" }}>
                <TableCell>
                  <Typography fontWeight={800} sx={{ color: textColor }}>{aff.detenu_nom}</Typography>
                  <Typography variant="caption" sx={{ color: textMuted, fontFamily: "monospace" }}>ID: #{String(aff.detenu).padStart(5, '0')}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={`${aff.cellule_numero} - ${aff.pavillon_nom || 'Zone'}`} sx={{ borderRadius: 1, fontWeight: 800, bgcolor: alpha(RDC_YELLOW, 0.1), border: `1px solid ${RDC_YELLOW}`, color: isDark ? RDC_YELLOW : "#B59A00" }} />
                </TableCell>
                <TableCell sx={{ color: textColor }}>{new Date(aff.date_entree).toLocaleDateString()}</TableCell>
                <TableCell>
                   <Typography variant="body2" noWrap sx={{ maxWidth: 200, color: textMuted }}>{aff.motif_affectation || "Ordre Standard"}</Typography>
                </TableCell>
                <TableCell align="right">
                  {view === "active" ? (
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Audit et Traçabilité"><IconButton onClick={() => openHistory(aff)} sx={{ color: RDC_YELLOW, bgcolor: alpha(RDC_YELLOW, 0.1) }}><HistoryOutlined /></IconButton></Tooltip>
                      <Tooltip title="Modifier l'affectation"><IconButton onClick={() => setEditModal({ open: true, data: aff })} sx={{ color: RDC_BLUE, bgcolor: alpha(RDC_BLUE, 0.1) }}><EditOutlined /></IconButton></Tooltip>
                      <Tooltip title="Suppression Sécurisée"><IconButton onClick={() => handleDelete(aff.id)} sx={{ color: RDC_RED, bgcolor: alpha(RDC_RED, 0.1) }}><DeleteOutline /></IconButton></Tooltip>
                    </Stack>
                  ) : (
                    <Button startIcon={<RestoreFromTrash />} variant="contained" sx={{ bgcolor: RDC_BLUE, borderRadius: 1, fontWeight: "bold" }} size="small" onClick={() => handleRestore(aff.id)}>
                      RÉTABLIR
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODALE D'ÉDITION */}
      <Dialog open={editModal.open} onClose={() => setEditModal({ open: false, data: null })} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: paperBg, backgroundImage: "none", borderRadius: 2, borderTop: `5px solid ${RDC_BLUE}`, boxShadow: glowEffect } }}>
        <DialogTitle sx={{ fontWeight: 900, color: textColor, textTransform: "uppercase" }}>Protocole de Transfert</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editModal.data && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField fullWidth disabled label="IDENTITÉ" value={editModal.data.detenu_nom} variant="outlined" InputLabelProps={{ sx: { color: textMuted } }} InputProps={{ sx: { color: textColor } }} />
              <TextField select fullWidth label="NOUVELLE CELLULE" value={editModal.data.cellule} onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, cellule: e.target.value } })} variant="outlined" InputLabelProps={{ sx: { color: textMuted } }} InputProps={{ sx: { color: textColor } }}>
                {cellules.map(c => <MenuItem key={c.id} value={c.id} sx={{ color: textColor }}>{c.numero} - {c.pavillon_nom}</MenuItem>)}
              </TextField>
              <TextField fullWidth multiline rows={3} label="MOTIF DU TRANSFERT" value={editModal.data.motif_affectation} onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, motif_affectation: e.target.value } })} variant="outlined" InputLabelProps={{ sx: { color: textMuted } }} InputProps={{ sx: { color: textColor } }} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setEditModal({ open: false, data: null })} sx={{ color: textMuted, fontWeight: "bold" }}>ANNULER</Button>
          <Button onClick={handleUpdate} variant="contained" sx={{ bgcolor: RDC_BLUE, borderRadius: 1, fontWeight: "bold" }}>VALIDER L'OPÉRATION</Button>
        </DialogActions>
      </Dialog>

      {/* MODALE HISTORIQUE (JSON COMPARED) */}
      <Dialog TransitionComponent={Zoom} open={historyModal.open} onClose={() => setHistoryModal({ ...historyModal, open: false })} fullWidth maxWidth="md" PaperProps={{ sx: { bgcolor: paperBg, backgroundImage: "none", borderRadius: 2, borderTop: `5px solid ${RDC_YELLOW}`, boxShadow: glowEffect } }}>
        <DialogTitle sx={{ borderBottom: `1px solid ${borderColor}`, pb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <HistoryOutlined sx={{ color: RDC_YELLOW, fontSize: 30 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: textColor }}>REGISTRE D'AUDIT</Typography>
              <Typography variant="caption" sx={{ color: textMuted, textTransform: "uppercase" }}>Sujet : {historyModal.target}</Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            {historyModal.logs.length === 0 ? (
              <Alert severity="info" sx={{ bgcolor: alpha(RDC_BLUE, 0.1), color: textColor, '& .MuiAlert-icon': { color: RDC_BLUE } }}>Aucune modification enregistrée.</Alert>
            ) : historyModal.logs.map((log, index) => {
                const oldCell = log.etat_ancien ? getCellNumero(log.etat_ancien.cellule) : "N/A";
                const newCell = getCellNumero(log.etat_actuel.cellule);
                
                return (
                  <Paper key={index} elevation={0} sx={{ p: 2, bgcolor: alpha(bgColor, 0.5), border: `1px solid ${borderColor}`, borderLeft: `4px solid ${log.action === 'CREATE' ? '#4caf50' : log.action === 'DELETE' ? RDC_RED : RDC_YELLOW}`, borderRadius: 1 }}>
                    <Stack direction="row" justifyContent="space-between" mb={2}>
                      <Chip label={`ACTION : ${log.action}`} size="small" sx={{ fontWeight: 900, bgcolor: alpha(textColor, 0.1), color: textColor, borderRadius: 1 }} />
                      <Typography variant="caption" sx={{ color: textMuted, fontFamily: "monospace", fontWeight: "bold" }}>
                        LE {new Date(log.date_modification).toLocaleString()} PAR {log.modifie_par_nom || "SYSTEME"}
                      </Typography>
                    </Stack>
                    
                    {log.action === 'UPDATE' && (
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={5}>
                          <Box sx={{ p: 1.5, bgcolor: alpha(RDC_RED, 0.05), border: `1px dashed ${RDC_RED}`, borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ color: RDC_RED, fontWeight: "bold", display: "block", mb: 1 }}>ÉTAT PRÉCÉDENT</Typography>
                            <Typography variant="body2" sx={{ color: textColor }}>Cellule : {oldCell}</Typography>
                            <Typography variant="body2" sx={{ color: textColor }}>Motif : {log.etat_ancien?.motif_affectation || "-"}</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={2} textAlign="center">
                          <CompareArrowsOutlined sx={{ color: textMuted, fontSize: 30 }} />
                        </Grid>
                        <Grid item xs={5}>
                          <Box sx={{ p: 1.5, bgcolor: alpha('#4caf50', 0.05), border: `1px dashed #4caf50`, borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: "bold", display: "block", mb: 1 }}>NOUVEL ÉTAT</Typography>
                            <Typography variant="body2" sx={{ color: textColor }}>Cellule : {newCell}</Typography>
                            <Typography variant="body2" sx={{ color: textColor }}>Motif : {log.etat_actuel.motif_affectation || "-"}</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    )}

                    {log.action !== 'UPDATE' && (
                       <Typography variant="body2" sx={{ color: textColor, mt: 1 }}>
                         Cellule assignée : <strong style={{ color: RDC_BLUE }}>{newCell}</strong>
                       </Typography>
                    )}
                  </Paper>
                );
            })}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${borderColor}` }}>
          <Button onClick={() => setHistoryModal({ ...historyModal, open: false })} variant="outlined" sx={{ color: textColor, borderColor: borderColor, fontWeight: "bold", borderRadius: 1 }}>FERMER L'AUDIT</Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR ALERTS */}
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.type} variant="filled" sx={{ borderRadius: 1, fontWeight: "bold", boxShadow: 3, width: "100%" }}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default GestionAffectations;