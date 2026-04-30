import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Box, Typography, alpha, Button, Grid, Paper, TextField, MenuItem, 
  Stack, Snackbar, Alert, IconButton, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, 
  DialogContent, DialogActions, Chip, CircularProgress, Avatar, 
  LinearProgress, Divider, Tooltip, useTheme
} from "@mui/material";
import {
  MeetingRoomOutlined, DeleteOutline, EditOutlined, 
  HistoryOutlined, RestoreFromTrash, AppsOutlined, 
  WarningAmberOutlined, CorporateFareOutlined, 
  SearchOutlined, RefreshOutlined, ShieldOutlined
} from "@mui/icons-material";

import api from "../../api";

// Import des assets officiels
import sceauRdc from "../../assets/gouvernement rdc.png";
import drapeauRdc from "../../assets/rdc.png";

// Couleurs de la charte
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1021";

const GestionCellules = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // --- VARIABLES DYNAMIQUES DE THÈME ---
  const bgColor = isDark ? "#050B14" : "#F4F6F8";
  const paperBg = isDark ? alpha("#ffffff", 0.03) : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#1A2027";
  const textMuted = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  // --- ÉTATS ---
  const [cellules, setCellules] = useState([]);
  const [pavillons, setPavillons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("active"); 
  const [filterPavillon, setFilterPavillon] = useState("all");
  
  // Modales
  const [openModal, setOpenModal] = useState(false);
  const [historyModal, setHistoryModal] = useState({ open: false, logs: [], cellName: "" });
  
  // Formulaire
  const [selectedCell, setSelectedCell] = useState(null);
  const [form, setForm] = useState({ pavillon: "", numero: "", capacite_max: 10 });
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", type: "success" });

  // --- LOGIQUE DE DONNÉES ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = view === "active" ? "/cellules/" : "/cellules/corbeille/";
      const params = filterPavillon !== "all" ? { pavillon: filterPavillon } : {};
      
      const [resCells, resPavs] = await Promise.all([
        api.get(`${endpoint}`, { params }),
        api.get("/pavillons/")
      ]);
      
      setCellules(resCells.data);
      setPavillons(resPavs.data);
    } catch (err) {
      setSnackbar({ open: true, msg: "Erreur de connexion au serveur", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [view, filterPavillon]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- ACTIONS ---
  const handleSave = async () => {
    if (!form.pavillon || !form.numero) return;
    try {
      if (selectedCell) {
        await api.put(`/cellules/${selectedCell.id}/`, form);
      } else {
        await api.post("/cellules/", form);
      }
      setOpenModal(false);
      fetchData();
      setSnackbar({ open: true, msg: "Système mis à jour avec succès", type: "success" });
    } catch (err) {
      setSnackbar({ open: true, msg: "Échec de l'opération", type: "error" });
    }
  };

  const openHistory = async (cell) => {
    try {
      const res = await api.get(`/cellules/${cell.id}/historique/`);
      setHistoryModal({ open: true, logs: res.data, cellName: cell.numero });
    } catch (err) {
      setSnackbar({ open: true, msg: "Impossible de charger les logs", type: "error" });
    }
  };

  // --- COMPOSANTS INTERNES ---
  const StatCard = ({ label, value, color, icon }) => (
    <Paper elevation={isDark ? 0 : 1} sx={{ p: 2, bgcolor: paperBg, borderLeft: `5px solid ${color}`, borderRadius: 0, borderTop: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}` }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="caption" fontWeight={900} sx={{ color, textTransform: "uppercase" }}>{label}</Typography>
          <Typography variant="h4" fontWeight={900} color={textColor}>{value}</Typography>
        </Box>
        <Avatar sx={{ bgcolor: alpha(color, 0.1), color: color, width: 45, height: 45 }}>{icon}</Avatar>
      </Stack>
    </Paper>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: bgColor, color: textColor, transition: 'all 0.3s ease' }}>
      
      {/* HEADER OFFICIEL MINISTÈRE */}
      <Paper elevation={isDark ? 0 : 2} sx={{ p: 3, mb: 4, bgcolor: paperBg, borderRadius: 0, border: `1px solid ${borderColor}` }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" spacing={3} alignItems="center">
            {/* Sceau en forme ronde */}
            <Avatar 
              src={sceauRdc} 
              alt="Sceau RDC" 
              sx={{ width: 70, height: 70, border: `2px solid ${RDC_YELLOW}`, bgcolor: "white", p: 0.5 }} 
            />
            <Box>
              <Typography variant="overline" sx={{ color: RDC_RED, fontWeight: 900, letterSpacing: 1.5, lineHeight: 1 }}>
                RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
              </Typography>
              <Typography variant="h5" sx={{ color: textColor, fontWeight: 900, textTransform: "uppercase", mt: 0.5 }}>
                Ministère de la Justice et Garde des Sceaux
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                <ShieldOutlined sx={{ fontSize: 16, color: RDC_BLUE }} />
                <Typography variant="body2" sx={{ color: textMuted, fontWeight: 600 }}>
                  Direction Générale des Services Pénitentiaires
                </Typography>
              </Stack>
            </Box>
          </Stack>
          {/* Drapeau RDC */}
          <Box component="img" src={drapeauRdc} alt="Drapeau RDC" sx={{ height: 45, borderRadius: 0.5, boxShadow: isDark ? 'none' : '0 2px 4px rgba(0,0,0,0.1)' }} />
        </Stack>
      </Paper>

      {/* HEADER TECHNIQUE */}
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" mb={4} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -1, color: textColor }}>
            SISTEM-CELLULES <span style={{ color: RDC_YELLOW }}>V3.2</span>
          </Typography>
          <Typography variant="body2" sx={{ color: textMuted }}>Tableau de bord de capacité et confinement</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            onClick={() => setView(view === "active" ? "corbeille" : "active")}
            startIcon={view === "active" ? <DeleteOutline /> : <RestoreFromTrash />}
            sx={{ color: view === "active" ? textColor : RDC_RED, borderColor: borderColor, borderRadius: 0 }}
          >
            {view === "active" ? "CORBEILLE" : "RETOUR AUX ACTIVES"}
          </Button>
          <Button 
            variant="contained" 
            onClick={() => { setSelectedCell(null); setForm({ pavillon: "", numero: "", capacite_max: 10 }); setOpenModal(true); }}
            startIcon={<MeetingRoomOutlined />}
            sx={{ bgcolor: RDC_BLUE, "&:hover": { bgcolor: alpha(RDC_BLUE, 0.8) }, borderRadius: 0, fontWeight: 900 }}
          >
            NOUVELLE CELLULE
          </Button>
        </Stack>
      </Stack>

      {/* BARRE DE FILTRE & STATS */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}><StatCard label="Total" value={cellules.length} color={RDC_BLUE} icon={<AppsOutlined />} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Critique (90%+)" value={cellules.filter(c => (c.occupation/c.capacite_max) >= 0.9).length} color={RDC_RED} icon={<WarningAmberOutlined />} /></Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={isDark ? 0 : 1} sx={{ p: 2, bgcolor: paperBg, borderRadius: 0, display: "flex", alignItems: "center", gap: 2, border: `1px solid ${borderColor}`, height: "100%" }}>
            <SearchOutlined sx={{ color: RDC_BLUE }} />
            <TextField
              select
              fullWidth
              size="small"
              label="Filtrer par Pavillon"
              value={filterPavillon}
              onChange={(e) => setFilterPavillon(e.target.value)}
              sx={{ 
                "& .MuiOutlinedInput-root": { color: textColor, borderRadius: 0 },
                "& .MuiInputLabel-root": { color: textMuted }
              }}
            >
              <MenuItem value="all">Tous les pavillons</MenuItem>
              {pavillons.map(p => <MenuItem key={p.id} value={p.id}>{p.nom}</MenuItem>)}
            </TextField>
            <IconButton onClick={fetchData} sx={{ color: textColor }}><RefreshOutlined /></IconButton>
          </Paper>
        </Grid>
      </Grid>

      {/* TABLEAU DE CONTRÔLE */}
      <TableContainer component={Paper} elevation={isDark ? 0 : 1} sx={{ borderRadius: 0, bgcolor: paperBg, border: `1px solid ${borderColor}` }}>
        <Table>
          <TableHead sx={{ bgcolor: isDark ? alpha(RDC_BLUE, 0.1) : alpha(RDC_BLUE, 0.05) }}>
            <TableRow>
              <TableCell sx={{ color: isDark ? RDC_BLUE : "#005bb5", fontWeight: 900 }}>REF. CELLULE</TableCell>
              <TableCell sx={{ color: isDark ? RDC_BLUE : "#005bb5", fontWeight: 900 }}>LOCALISATION</TableCell>
              <TableCell sx={{ color: isDark ? RDC_BLUE : "#005bb5", fontWeight: 900 }}>DENSITÉ D'OCCUPATION</TableCell>
              <TableCell align="right" sx={{ color: isDark ? RDC_BLUE : "#005bb5", fontWeight: 900 }}>LOGISTIQUE</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 10 }}><CircularProgress size={30} sx={{ color: RDC_BLUE }} /></TableCell></TableRow>
            ) : cellules.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5, color: textMuted }}>Aucune cellule enregistrée dans cette zone.</TableCell></TableRow>
            ) : cellules.map((cell) => {
              const ratio = (cell.occupation / cell.capacite_max) * 100;
              const isCritical = ratio >= 90;
              return (
                <TableRow key={cell.id} sx={{ "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" } }}>
                  <TableCell>
                    <Typography variant="body1" fontWeight={900} color={textColor}>{cell.numero}</Typography>
                    {isCritical && <Chip label="CAPACITÉ ATTEINTE" size="small" sx={{ bgcolor: RDC_RED, color: "white", fontSize: 9, borderRadius: 0, mt: 0.5, fontWeight: "bold" }} />}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CorporateFareOutlined sx={{ fontSize: 18, color: RDC_YELLOW }} />
                      <Typography variant="body2" sx={{ color: textMuted }}>{cell.pavillon_nom}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ width: 300 }}>
                    <Stack spacing={0.5}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" sx={{ color: isCritical ? RDC_RED : textColor, fontWeight: isCritical ? 800 : 500 }}>
                          {cell.occupation} / {cell.capacite_max} Détenus
                        </Typography>
                        <Typography variant="caption" fontWeight={900} color={textColor}>{Math.round(ratio)}%</Typography>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(ratio, 100)} 
                        sx={{ 
                          height: 8, 
                          bgcolor: isDark ? alpha("#fff", 0.1) : alpha("#000", 0.1), 
                          "& .MuiLinearProgress-bar": { bgcolor: isCritical ? RDC_RED : RDC_BLUE } 
                        }} 
                      />
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    {view === "active" ? (
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Historique"><IconButton size="small" onClick={() => openHistory(cell)} sx={{ color: textMuted }}><HistoryOutlined /></IconButton></Tooltip>
                        <Tooltip title="Éditer"><IconButton size="small" onClick={() => { setSelectedCell(cell); setForm({ pavillon: cell.pavillon, numero: cell.numero, capacite_max: cell.capacite_max }); setOpenModal(true); }} sx={{ color: RDC_BLUE }}><EditOutlined /></IconButton></Tooltip>
                        <Tooltip title="Supprimer"><IconButton size="small" onClick={() => axios.delete(`http://127.0.0.1:8000/api/cellules/${cell.id}/`).then(fetchData)} sx={{ color: RDC_RED }}><DeleteOutline /></IconButton></Tooltip>
                      </Stack>
                    ) : (
                      <Button startIcon={<RestoreFromTrash />} color="success" variant="outlined" sx={{ borderRadius: 0 }} onClick={() => axios.post(`http://127.0.0.1:8000/api/cellules/${cell.id}/restaurer/`).then(fetchData)}>
                        RESTAURER
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* DIALOGUE CONFIGURATION */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} PaperProps={{ sx: { bgcolor: paperBg, color: textColor, borderRadius: 0, minWidth: 400, border: `1px solid ${borderColor}` } }}>
        <DialogTitle sx={{ borderBottom: `2px solid ${RDC_BLUE}`, fontWeight: 900 }}>
          {selectedCell ? "MODIFIER CELLULE" : "UNITÉ DE CONFINEMENT"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField select fullWidth label="PAVILLON" value={form.pavillon} onChange={(e) => setForm({...form, pavillon: e.target.value})} variant="filled" InputLabelProps={{ style: { color: textMuted } }} sx={{ bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" }}>
              {pavillons.map(p => <MenuItem key={p.id} value={p.id}>{p.nom}</MenuItem>)}
            </TextField>
            <TextField fullWidth label="NUMÉRO D'IDENTIFICATION" value={form.numero} onChange={(e) => setForm({...form, numero: e.target.value})} variant="filled" InputLabelProps={{ style: { color: textMuted } }} sx={{ bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" }} />
            <TextField fullWidth type="number" label="CAPACITÉ NOMINALE (PERSONNES)" value={form.capacite_max} onChange={(e) => setForm({...form, capacite_max: e.target.value})} variant="filled" InputLabelProps={{ style: { color: textMuted } }} sx={{ bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: isDark ? alpha("#050B14", 0.5) : alpha("#000", 0.02) }}>
          <Button onClick={() => setOpenModal(false)} sx={{ color: textColor }}>ANNULER</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: RDC_BLUE, borderRadius: 0 }}>VALIDER ENTRÉE</Button>
        </DialogActions>
      </Dialog>

      {/* MODALE HISTORIQUE */}
      <Dialog open={historyModal.open} onClose={() => setHistoryModal({...historyModal, open: false})} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 0, bgcolor: paperBg, color: textColor } }}>
        <DialogTitle sx={{ fontWeight: 900, borderBottom: `1px solid ${borderColor}` }}>LOGS DE SÉCURITÉ : {historyModal.cellName}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {historyModal.logs.length === 0 ? (
            <Typography variant="body2" sx={{ color: textMuted, mt: 2 }}>Aucun log enregistré.</Typography>
          ) : historyModal.logs.map((log, index) => (
            <Box key={index} sx={{ mb: 2, p: 1.5, bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderLeft: `3px solid ${RDC_BLUE}` }}>
              <Typography variant="caption" sx={{ color: textMuted }}>{new Date(log.date_modification).toLocaleString()}</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}><b>Action:</b> {log.action}</Typography>
              <Typography variant="body2"><b>Opérateur:</b> {log.modifie_par || "Système Admin"}</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${borderColor}` }}>
          <Button onClick={() => setHistoryModal({...historyModal, open: false})} sx={{ color: textColor }}>FERMER</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({...snackbar, open: false})}>
        <Alert severity={snackbar.type} variant="filled" sx={{ borderRadius: 0 }}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default GestionCellules;