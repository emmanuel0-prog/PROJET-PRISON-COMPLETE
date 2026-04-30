import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Box, Typography, alpha, Button, Grid, Paper, Stack, Snackbar, Alert, 
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Chip, CircularProgress, Avatar, Tabs, Tab, Tooltip, useTheme,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem
} from "@mui/material";
import {
  AccessTimeOutlined, RestaurantOutlined, GroupWorkOutlined,
  CheckCircleOutline, WarningAmberOutlined, PlayCircleOutline,
  PauseCircleOutline, VerifiedUserOutlined, AddOutlined, 
  EditOutlined, DeleteOutline, DeleteSweepOutlined, RestoreOutlined
} from "@mui/icons-material";

// Assets (à adapter selon ton projet)
import sceauRdc from "../../assets/gouvernement rdc.png";
import drapeauRdc from "../../assets/rdc.png";
import api from "../../api"; // Ton instance Axios

const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1021";

// --- URLS DE BASE ---


const CentreOperationsPénitentiaires = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // --- STYLES ---
  const bgColor = isDark ? "#020617" : "#F1F5F9";
  const paperBg = isDark ? alpha("#0F172A", 0.9) : "#FFFFFF";
  const glowEffect = isDark ? `0 0 20px ${alpha(RDC_BLUE, 0.2)}` : `0 10px 30px ${alpha(RDC_BLUE, 0.08)}`;
  const borderColor = alpha(RDC_BLUE, 0.15);

  // --- ÉTATS ---
  const [tabIndex, setTabIndex] = useState(0); // 0: Activités, 1: Rations, 2: Corvées, 3: Corbeille
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", type: "success" });
  
  // Données
  const [activites, setActivites] = useState([]);
  const [rations, setRations] = useState([]);
  const [corvees, setCorvees] = useState([]);
  const [corbeille, setCorbeille] = useState([]); // Simule les éléments supprimés

  // Modal CRUD
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // Form State Unifié
  const initialForm = {
    label: "", heure_debut: "", heure_fin: "", type_activite: "ROUTINE", nb_detenus_prevus: 0,
    repas: "PETIT_DEJ", total_attendu: 0, total_servi: 0,
    responsable_equipe: "", statut: "EN_COURS"
  };
  const [formData, setFormData] = useState(initialForm);

  // --- CHARGEMENT DES DONNÉES ---
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [resAct, resRat, resCor] = await Promise.all([
        api.get(`/activites/`),
        api.get(`/rations/`),
        api.get(`/corvees/`)
      ]);
      
      // Simulation: Filtrer ceux qui ont is_deleted=true pour la corbeille (si implémenté côté backend)
      // Pour l'instant, on affiche tout dans les tabs principaux.
      setActivites(resAct.data);
      setRations(resRat.data);
      setCorvees(resCor.data);
    } catch (err) {
      showSnack("Erreur de connexion au QG", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const showSnack = (msg, type = "success") => setSnackbar({ open: true, msg, type });

  // --- GESTION CRUD ---
  const handleOpenModal = (item = null) => {
    if (item) {
      setEditMode(true);
      setCurrentId(item.id);
      setFormData({ ...initialForm, ...item });
    } else {
      setEditMode(false);
      setCurrentId(null);
      setFormData(initialForm);
    }
    setModalOpen(true);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getEndpoint = () => {
    if (tabIndex === 0) return "activites";
    if (tabIndex === 1) return "rations";
    if (tabIndex === 2) return "corvees";
  };

  const handleSubmit = async () => {
    const endpoint = getEndpoint();
    try {
      if (editMode) {
        await api.put(`/${endpoint}/${currentId}/`, formData);
        showSnack("Mise à jour réussie");
      } else {
        await api.post(`/${endpoint}/`, formData);
        showSnack("Enregistrement réussi");
      }
      setModalOpen(false);
      fetchAllData();
    } catch (error) {
      showSnack("Erreur lors de l'enregistrement", "error");
    }
  };

  const handleDelete = async (id, moduleName) => {
    if (!window.confirm("Déplacer cet élément vers la corbeille ?")) return;
    try {
      // NOTE: Remplacer delete par un patch({is_deleted: true}) si le backend le supporte.
      // Ici on simule une suppression classique.
      await axios.delete(`${API_BASE}/${moduleName}/${id}/`);
      
      // Simulation Corbeille Front-End (Dans la vraie vie, on fetch depuis l'API)
      const deletedItem = [...activites, ...rations, ...corvees].find(i => i.id === id);
      if(deletedItem) setCorbeille(prev => [...prev, { ...deletedItem, _module: moduleName }]);
      
      showSnack("Élément archivé dans la corbeille", "info");
      fetchAllData();
    } catch (error) {
      showSnack("Erreur lors de la suppression", "error");
    }
  };

  // --- RENDER MODAL FORMULAIRE DYNAMIQUE ---
  const renderFormFields = () => {
    if (tabIndex === 0) return ( // ACTIVITES
      <Grid container spacing={2}>
        <Grid item xs={12}><TextField fullWidth label="Label de l'activité" name="label" value={formData.label} onChange={handleChange} /></Grid>
        <Grid item xs={6}><TextField fullWidth type="time" label="Heure de début" name="heure_debut" value={formData.heure_debut} onChange={handleChange} InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={6}><TextField fullWidth type="time" label="Heure de fin" name="heure_fin" value={formData.heure_fin} onChange={handleChange} InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={6}>
          <TextField select fullWidth label="Type d'activité" name="type_activite" value={formData.type_activite} onChange={handleChange}>
            <MenuItem value="ROUTINE">Routine</MenuItem>
            <MenuItem value="TRAVAIL">Travail</MenuItem>
            <MenuItem value="CANTINE">Cantine</MenuItem>
            <MenuItem value="LOISIR">Loisir</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={6}><TextField fullWidth type="number" label="Effectif Prévu" name="nb_detenus_prevus" value={formData.nb_detenus_prevus} onChange={handleChange} /></Grid>
      </Grid>
    );

    if (tabIndex === 1) return ( // RATIONS
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField select fullWidth label="Type de Repas" name="repas" value={formData.repas} onChange={handleChange}>
            <MenuItem value="PETIT_DEJ">Petit Déjeuner</MenuItem>
            <MenuItem value="DEJEUNER">Déjeuner</MenuItem>
            <MenuItem value="DINER">Dîner</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={6}><TextField fullWidth type="number" label="Total Attendu" name="total_attendu" value={formData.total_attendu} onChange={handleChange} /></Grid>
        <Grid item xs={6}><TextField fullWidth type="number" label="Total Servi" name="total_servi" value={formData.total_servi} onChange={handleChange} /></Grid>
      </Grid>
    );

    if (tabIndex === 2) return ( // CORVEES
      <Grid container spacing={2}>
        <Grid item xs={12}><TextField fullWidth label="Mission / Corvée" name="label" value={formData.label} onChange={handleChange} /></Grid>
        <Grid item xs={12}><TextField fullWidth label="Garde Responsable" name="responsable_equipe" value={formData.responsable_equipe} onChange={handleChange} /></Grid>
        <Grid item xs={12}>
          <TextField select fullWidth label="Statut" name="statut" value={formData.statut} onChange={handleChange}>
            <MenuItem value="EN_COURS">En Cours</MenuItem>
            <MenuItem value="TERMINE">Terminé</MenuItem>
            <MenuItem value="INCIDENT">Incident</MenuItem>
          </TextField>
        </Grid>
      </Grid>
    );
  };

  // --- RENDU DES TABLEAUX (Refactorisé pour inclure Edit/Delete) ---
  const TableActions = ({ item, moduleName }) => (
    <Stack direction="row" spacing={1} justifyContent="flex-end">
      <Tooltip title="Modifier"><IconButton size="small" onClick={() => handleOpenModal(item)} sx={{ color: RDC_BLUE }}><EditOutlined fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Supprimer (Corbeille)"><IconButton size="small" onClick={() => handleDelete(item.id, moduleName)} sx={{ color: RDC_RED }}><DeleteOutline fontSize="small" /></IconButton></Tooltip>
    </Stack>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: bgColor }}>
      
      {/* HEADER */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: paperBg, border: `1px solid ${borderColor}`, borderRadius: 3, boxShadow: glowEffect }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar src={sceauRdc} sx={{ width: 80, height: 80, border: `2px solid ${RDC_YELLOW}` }} />
            <Box>
              <Typography variant="overline" sx={{ color: RDC_RED, fontWeight: 900 }}>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: RDC_BLUE }}>QG OPÉRATIONNEL - CRUD</Typography>
            </Box>
          </Stack>
          <Box component="img" src={drapeauRdc} sx={{ height: 60, borderRadius: 1 }} />
        </Stack>
      </Paper>

      {/* CONTROLES & TABS */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} sx={{ '& .MuiTabs-indicator': { backgroundColor: RDC_BLUE, height: 3 } }}>
          <Tab icon={<AccessTimeOutlined />} label="ACTIVITÉS" sx={{ fontWeight: 900 }} />
          <Tab icon={<RestaurantOutlined />} label="RATIONS" sx={{ fontWeight: 900 }} />
          <Tab icon={<GroupWorkOutlined />} label="CORVÉES" sx={{ fontWeight: 900 }} />
          <Tab icon={<DeleteSweepOutlined />} label="CORBEILLE" sx={{ fontWeight: 900, color: RDC_RED }} />
        </Tabs>
        
        {tabIndex !== 3 && (
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => handleOpenModal()} sx={{ bgcolor: RDC_BLUE, fontWeight: 900, borderRadius: 2 }}>
            NOUVEL ENREGISTREMENT
          </Button>
        )}
      </Stack>

      {/* CONTENU TABLEAUX */}
      {loading ? <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 10 }} /> : (
        <TableContainer component={Paper} sx={{ bgcolor: paperBg, borderRadius: 3, border: `1px solid ${borderColor}` }}>
          <Table>
            
            {/* TÊTES DE TABLEAU DYNAMIQUES */}
            <TableHead sx={{ bgcolor: alpha(RDC_BLUE, 0.05) }}>
              {tabIndex === 0 && (
                <TableRow>
                  <TableCell>ACTIVITÉ</TableCell><TableCell>HORAIRE</TableCell><TableCell>TYPE</TableCell>
                  <TableCell align="right">ACTIONS</TableCell>
                </TableRow>
              )}
              {tabIndex === 1 && (
                <TableRow>
                  <TableCell>DATE</TableCell><TableCell>REPAS</TableCell><TableCell>SERVI / ATTENDU</TableCell>
                  <TableCell align="right">ACTIONS</TableCell>
                </TableRow>
              )}
              {tabIndex === 2 && (
                <TableRow>
                  <TableCell>MISSION</TableCell><TableCell>GARDE</TableCell><TableCell>STATUT</TableCell>
                  <TableCell align="right">ACTIONS</TableCell>
                </TableRow>
              )}
              {tabIndex === 3 && (
                <TableRow>
                  <TableCell>ID / MODULE</TableCell><TableCell>INFORMATION</TableCell>
                  <TableCell align="right">RESTAURATION</TableCell>
                </TableRow>
              )}
            </TableHead>

            {/* CORPS DE TABLEAU DYNAMIQUES */}
            <TableBody>
              {tabIndex === 0 && activites.map(act => (
                <TableRow key={act.id}>
                  <TableCell sx={{ fontWeight: 800 }}>{act.label}</TableCell>
                  <TableCell>{act.heure_debut} - {act.heure_fin}</TableCell>
                  <TableCell><Chip label={act.type_activite} size="small" /></TableCell>
                  <TableCell><TableActions item={act} moduleName="activites" /></TableCell>
                </TableRow>
              ))}

              {tabIndex === 1 && rations.map(rat => (
                <TableRow key={rat.id}>
                  <TableCell>{new Date(rat.date).toLocaleDateString()}</TableCell>
                  <TableCell><Chip label={rat.repas} size="small" /></TableCell>
                  <TableCell>{rat.total_servi} / {rat.total_attendu}</TableCell>
                  <TableCell><TableActions item={rat} moduleName="rations" /></TableCell>
                </TableRow>
              ))}

              {tabIndex === 2 && corvees.map(cor => (
                <TableRow key={cor.id}>
                  <TableCell sx={{ fontWeight: 800 }}>{cor.label}</TableCell>
                  <TableCell>{cor.responsable_equipe}</TableCell>
                  <TableCell><Chip label={cor.statut} size="small" color={cor.statut === 'INCIDENT' ? "error" : "default"} /></TableCell>
                  <TableCell><TableActions item={cor} moduleName="corvees" /></TableCell>
                </TableRow>
              ))}

              {/* CORBEILLE VUE */}
              {tabIndex === 3 && corbeille.map((del, idx) => (
                <TableRow key={idx}>
                  <TableCell><Chip label={del._module.toUpperCase()} color="error" size="small" /></TableCell>
                  <TableCell>{del.label || del.repas || "Archive inconnue"}</TableCell>
                  <TableCell align="right">
                    <Button startIcon={<RestoreOutlined />} color="success" size="small" variant="outlined" onClick={() => showSnack("Restauration nécessite le backend", "info")}>
                      RESTAURER
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* MODAL AJOUT/MODIFICATION */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 900, bgcolor: alpha(RDC_BLUE, 0.05) }}>
          {editMode ? "METTRE À JOUR LE DOSSIER" : "NOUVEL ENREGISTREMENT"}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {renderFormFields()}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalOpen(false)} color="inherit" sx={{ fontWeight: 800 }}>ANNULER</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: RDC_BLUE, fontWeight: 800 }}>SAUVEGARDER</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.type} variant="filled" sx={{ fontWeight: 900 }}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CentreOperationsPénitentiaires;