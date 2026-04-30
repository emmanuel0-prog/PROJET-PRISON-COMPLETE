import React, { useState, useEffect } from "react";

import {
  Box, Typography, useTheme, alpha, Button, Grid, Paper,
  TextField, MenuItem, Stack, Snackbar, Alert, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  CircularProgress, Tooltip, Avatar, LinearProgress
} from "@mui/material";

import {
  UploadFileOutlined, DeleteOutline, EditOutlined, 
  WarningAmberOutlined, FilterAltOutlined, CheckCircleOutline, 
  TimerOutlined, PictureAsPdfOutlined, FolderOpenOutlined, 
  DeleteSweepOutlined, HistoryOutlined, RestoreFromTrash
} from "@mui/icons-material";

// ✅ API CENTRALISÉ
import api from "../../api";

// COULEURS
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1021";
const DEEP_NAVY = "#050B14";

const TYPE_DOC_CHOICES = [
  { value: "MAP", label: "Mandat d'Arrêt Provisoire" },
  { value: "ODP", label: "Ordonnance de Détention Préventive" },
  { value: "JUGEMENT", label: "Jugement de Condamnation" },
  { value: "ARRET", label: "Arrêt de Justice/Appel" },
  { value: "LRP", label: "Levée de l'Écrou" },
];

const GestionDocumentsEcrou = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [documents, setDocuments] = useState([]);
  const [parquets, setParquets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, alertes: 0, expires: 0 });

  const [filterAlert, setFilterAlert] = useState(false);
  const [view, setView] = useState("active");

  const [openModal, setOpenModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [form, setForm] = useState({
    detenu: "",
    type_document: "ODP",
    numero_document: "",
    parquet_emetteur: "",
    date_emission: "",
    date_expiration: "",
    fichier_scanne: null
  });

  const [historyModal, setHistoryModal] = useState({ open: false, data: [] });

  const [snackbar, setSnackbar] = useState({ open: false, msg: "", type: "success" });

  const showMsg = (msg, type = "success") =>
    setSnackbar({ open: true, msg, type });

  // ================================
  // ✅ AJOUT 1 : OPEN MODAL (FIX)
  // ================================
  const handleOpenModal = (doc = null) => {
    if (doc) {
      setSelectedDoc(doc);
      setForm({
        detenu: doc.detenu,
        type_document: doc.type_document,
        numero_document: doc.numero_document,
        parquet_emetteur: doc.parquet_emetteur,
        date_emission: doc.date_emission,
        date_expiration: doc.date_expiration,
        fichier_scanne: null
      });
    } else {
      setSelectedDoc(null);
      setForm({
        detenu: "",
        type_document: "ODP",
        numero_document: "",
        parquet_emetteur: "",
        date_emission: "",
        date_expiration: "",
        fichier_scanne: null
      });
    }

    setOpenModal(true);
  };

  // ================================
  // ✅ AJOUT 2 : FETCH HISTORIQUE
  // ================================
  const fetchHistory = async (id) => {
    try {
      const res = await api.get(`/documents-ecrou/${id}/historique/`);
      setHistoryModal({ open: true, data: res.data });
    } catch (err) {
      showMsg("Impossible de charger l'historique", "error");
    }
  };

  // ================================
  // FETCH DATA (INCHANGÉ)
  // ================================
  const fetchData = async () => {
    setLoading(true);
    try {
      let url = "/documents-ecrou/";

      if (view === "corbeille") {
        url = "/documents-ecrou/corbeille/";
      } else if (filterAlert) {
        url = "/documents-ecrou/?proche_expiration=true";
      }

      const [resDocs, resParquets, resAlertCount] = await Promise.all([
        api.get(url),
        api.get("/parquets/"),
        api.get("/documents-ecrou/count-alertes/")
      ]);

      setDocuments(resDocs.data);
      setParquets(resParquets.data);

      const expires = resDocs.data.filter(d => d.est_expire).length;

      setStats(prev => ({
        total: view === "active" ? resDocs.data.length : prev.total,
        alertes: resAlertCount.data.count,
        expires
      }));

    } catch (err) {
      console.error(err);
      showMsg("Erreur de synchronisation avec le serveur", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterAlert, view]);

  // ================================
  // SAVE (INCHANGÉ)
  // ================================
  const handleSave = async () => {
    const formData = new FormData();

    Object.keys(form).forEach(key => {
      if (form[key] !== null) {
        formData.append(key, form[key]);
      }
    });

    try {
      if (selectedDoc) {
        await api.patch(`/documents-ecrou/${selectedDoc.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        showMsg("Document mis à jour (Tracé dans l'historique)");
      } else {
        await api.post("/documents-ecrou/", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        showMsg("Nouveau document enregistré");
      }

      setOpenModal(false);
      fetchData();

    } catch (err) {
      showMsg("Erreur lors de l'enregistrement", "error");
    }
  };

  // ================================
  // DELETE / RESTORE (INCHANGÉ)
  // ================================
  const handleDelete = async (id) => {
    if (!window.confirm("Placer ce document dans la corbeille ?")) return;

    try {
      await api.delete(`/documents-ecrou/${id}/`);
      showMsg("Document archivé", "info");
      fetchData();
    } catch {
      showMsg("Échec de l'archivage", "error");
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.post(`/documents-ecrou/${id}/restaurer/`);
      showMsg("Document restauré", "success");
      fetchData();
    } catch {
      showMsg("Erreur restauration", "error");
    }
  };



  // --- RENDU DES COMPOSANTS ---
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
          <Typography variant="h4" fontWeight={900} color={RDC_BLUE}>SISTEM-ÉCROU <span style={{color: RDC_YELLOW}}>V3</span></Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>Gestion automatisée des titres de détention et alertes ODP</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
            <Button 
                variant={filterAlert ? "contained" : "outlined"} 
                color="error" 
                onClick={() => { setFilterAlert(!filterAlert); setView("active"); }}
                startIcon={<WarningAmberOutlined />}
                sx={{ borderRadius: 0, fontWeight: 900 }}
            >
                {filterAlert ? "VOIR TOUT" : `ALERTES (${stats.alertes})`}
            </Button>
            <Button 
                variant="contained" 
                onClick={() => handleOpenModal()} 
                startIcon={<UploadFileOutlined />}
                sx={{ bgcolor: RDC_BLUE, borderRadius: 0, fontWeight: 900 }}
            >
                NOUVEL ÉCROU
            </Button>
        </Stack>
      </Stack>

      {/* STATS QUICK VIEW */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}><StatBox label="Documents Actifs" value={stats.total} color={RDC_BLUE} icon={<FolderOpenOutlined />} /></Grid>
        <Grid item xs={12} md={4}><StatBox label="En Alerte (48h)" value={stats.alertes} color={RDC_YELLOW} icon={<TimerOutlined />} /></Grid>
        <Grid item xs={12} md={4}><StatBox label="Expirés" value={stats.expires} color={RDC_RED} icon={<DeleteSweepOutlined />} /></Grid>
      </Grid>

      {/* --- NOUVEAU : SWITCH ACTIFS / CORBEILLE --- */}
      <Stack direction="row" spacing={2} mb={2}>
        <Button 
          variant={view === "active" ? "contained" : "text"} 
          sx={{ borderRadius: 0, fontWeight: 800, bgcolor: view === "active" ? alpha(RDC_BLUE, 0.9) : "transparent" }}
          onClick={() => { setView("active"); setFilterAlert(false); }}
        >
          DOSSIERS ACTIFS
        </Button>
        <Button 
          variant={view === "corbeille" ? "contained" : "text"} 
          color="error"
          startIcon={<DeleteSweepOutlined />}
          sx={{ borderRadius: 0, fontWeight: 800 }}
          onClick={() => { setView("corbeille"); setFilterAlert(false); }}
        >
          CORBEILLE & ARCHIVES
        </Button>
      </Stack>

      {/* MAIN TABLE */}
      <Paper sx={{ borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, overflow: "hidden" }}>
        <Box sx={{ p: 2, bgcolor: view === "corbeille" ? alpha(RDC_RED, 0.05) : alpha(RDC_BLUE, 0.05), borderBottom: `1px solid ${alpha(view === "corbeille" ? RDC_RED : RDC_BLUE, 0.2)}` }}>
            <Stack direction="row" spacing={2} alignItems="center">
                <FilterAltOutlined color={view === "corbeille" ? "error" : "inherit"} />
                <Typography variant="subtitle2" fontWeight={900} color={view === "corbeille" ? RDC_RED : "inherit"}>
                  {view === "corbeille" ? "CONSULTATION DE LA CORBEILLE (LECTURE SEULE)" : "FILTRAGE AVANCÉ DES ARCHIVES"}
                </Typography>
            </Stack>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: isDark ? "#000" : "#f1f1f1" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 900 }}>DÉTENU & MATRICULE</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>TYPE DE DOCUMENT</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>RÉFÉRENCE</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>EXPIRATION / STATUT</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell></TableRow>
              ) : documents.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" sx={{py: 3, opacity: 0.6}}>Aucun document trouvé.</Typography></TableCell></TableRow>
              ) : documents.map((doc) => (
                <TableRow key={doc.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 }, opacity: view === "corbeille" ? 0.7 : 1 }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={800} sx={{ textDecoration: view === "corbeille" ? "line-through" : "none" }}>{doc.detenu_nom_complet}</Typography>
                    <Typography variant="caption" sx={{ bgcolor: alpha(RDC_BLUE, 0.1), px: 0.5, color: RDC_BLUE }}>{doc.detenu_matricule}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={doc.type_document} size="small" sx={{ fontWeight: 900, borderRadius: 0, bgcolor: doc.type_document === 'ODP' ? RDC_YELLOW : alpha(theme.palette.text.primary, 0.1) }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{doc.numero_document}</Typography>
                    <Typography variant="caption" display="block">{doc.parquet_nom}</Typography>
                  </TableCell>
                  <TableCell>
                    {view === "corbeille" ? (
                      <Chip label="Supprimé" color="error" size="small" sx={{ borderRadius: 0, fontWeight: 800 }} />
                    ) : doc.date_expiration ? (
                      <Box>
                         <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" fontWeight={700} color={doc.est_expire ? RDC_RED : "inherit"}>
                                {doc.date_expiration}
                            </Typography>
                            {doc.est_expire ? <WarningAmberOutlined sx={{ color: RDC_RED, fontSize: 16 }} /> : <CheckCircleOutline sx={{ color: "green", fontSize: 16 }} />}
                         </Stack>
                         <Typography variant="caption" color={doc.est_expire ? "error" : "textSecondary"}>
                            {doc.temps_restant_info?.message || "Expiré"} ({doc.temps_restant_info?.jours || 0}j)
                         </Typography>
                         <LinearProgress 
                            variant="determinate" 
                            value={doc.est_expire ? 100 : Math.max(0, 100 - ((doc.temps_restant_info?.jours || 0) * 5))} 
                            sx={{ height: 4, mt: 0.5, borderRadius: 2, bgcolor: alpha(RDC_YELLOW, 0.1), "& .MuiLinearProgress-bar": { bgcolor: doc.est_expire ? RDC_RED : RDC_YELLOW } }} 
                        />
                      </Box>
                    ) : "--"}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {/* --- ACTIONS CONDITIONNELLES SELON LA VUE --- */}
                      {view === "corbeille" ? (
                        <Tooltip title="Restaurer le document">
                          <Button size="small" variant="outlined" color="success" onClick={() => handleRestore(doc.id)} startIcon={<RestoreFromTrash />}>
                            RESTAURER
                          </Button>
                        </Tooltip>
                      ) : (
                        <>
                          <Tooltip title="Voir l'Historique (Audit)">
                            <IconButton size="small" onClick={() => fetchHistory(doc.id)}><HistoryOutlined color="info" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Voir le Scan">
                            <IconButton size="small" href={doc.fichier_scanne} target="_blank"><PictureAsPdfOutlined color="error" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Modifier">
                            <IconButton size="small" onClick={() => handleOpenModal(doc)}><EditOutlined color="primary" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Archiver (Corbeille)">
                            <IconButton size="small" onClick={() => handleDelete(doc.id)}><DeleteOutline color="error" /></IconButton>
                          </Tooltip>
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

      {/* --- NOUVEAU : MODAL D'HISTORIQUE (AUDIT TRAIL) --- */}
      <Dialog open={historyModal.open} onClose={() => setHistoryModal({ ...historyModal, open: false })} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ fontWeight: 900, borderBottom: `2px solid ${RDC_BLUE}`, display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryOutlined /> TRACABILITÉ DES MODIFICATIONS
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {historyModal.data.length === 0 ? (
            <Typography variant="body1" sx={{ p: 4, textAlign: "center", opacity: 0.6 }}>Aucune modification enregistrée pour ce document.</Typography>
          ) : (
            <Table size="small">
              <TableHead sx={{ bgcolor: alpha(RDC_BLUE, 0.05) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>DATE</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>CHAMP MODIFIÉ</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: RDC_RED }}>ANCIENNE VALEUR</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: RDC_BLUE }}>NOUVELLE VALEUR</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>AGENT</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyModal.data.map((h) => (
                  <TableRow key={h.id} hover>
                    <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{h.date_action_fr}</TableCell>
                    <TableCell><Chip label={h.champ} size="small" sx={{ borderRadius: 0, fontWeight: 700 }} /></TableCell>
                    <TableCell sx={{ textDecoration: 'line-through', opacity: 0.6, fontFamily: 'monospace' }}>{h.ancienne_valeur}</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{h.nouvelle_valeur}</TableCell>
                    <TableCell><Typography variant="caption" sx={{ fontWeight: 900, bgcolor: alpha(theme.palette.text.primary, 0.1), px: 1, py: 0.5 }}>{h.utilisateur}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setHistoryModal({ ...historyModal, open: false })} variant="contained" sx={{ bgcolor: DEEP_NAVY, borderRadius: 0, fontWeight: 900 }}>FERMER</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL AJOUT / EDIT */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        {/* ... (Ton code pour la modale d'ajout/édition reste strictement identique) ... */}
        <DialogTitle sx={{ fontWeight: 900, borderBottom: `2px solid ${RDC_BLUE}` }}>
          {selectedDoc ? "MODIFICATION DU TITRE" : "ENREGISTREMENT NOUVEL ÉCROU"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth label="TYPE DE DOCUMENT" value={form.type_document} onChange={(e) => setForm({...form, type_document: e.target.value})} variant="filled">
                {TYPE_DOC_CHOICES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="RÉFÉRENCE (N° RMP/RP)" value={form.numero_document} onChange={(e) => setForm({...form, numero_document: e.target.value})} variant="filled" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth label="PARQUET ÉMETTEUR" value={form.parquet_emetteur} onChange={(e) => setForm({...form, parquet_emetteur: e.target.value})} variant="filled">
                {parquets.map(p => <MenuItem key={p.id} value={p.id}>{p.nom}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="date" label="DATE D'ÉMISSION" InputLabelProps={{ shrink: true }} value={form.date_emission} onChange={(e) => setForm({...form, date_emission: e.target.value})} variant="filled" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth type="date" label="EXPIRATION LÉGALE" 
                InputLabelProps={{ shrink: true }} 
                value={form.date_expiration || ""} 
                onChange={(e) => setForm({...form, date_expiration: e.target.value})} 
                variant="filled"
                helperText="Obligatoire pour MAP et ODP"
                error={form.type_document === 'ODP' && !form.date_expiration}
              />
            </Grid>
            <Grid item xs={12} md={6}>
                <Button fullWidth component="label" variant="outlined" sx={{ height: "56px", borderStyle: "dashed", fontWeight: 900 }}>
                    {form.fichier_scanne ? "FICHIER PRÊT" : "SCANNER / JOINDRE LE PDF"}
                    <input type="file" hidden onChange={(e) => setForm({...form, fichier_scanne: e.target.files[0]})} />
                </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenModal(false)} sx={{ fontWeight: 900, color: "gray" }}>ANNULER</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: RDC_BLUE, fontWeight: 900, px: 4 }}>
            {selectedDoc ? "METTRE À JOUR" : "SCELLER LE DOCUMENT"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.type} variant="filled" sx={{ fontWeight: 900, borderRadius: 0 }}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default GestionDocumentsEcrou;