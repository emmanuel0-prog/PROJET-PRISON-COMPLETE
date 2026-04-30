import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
// 🚀 ON REMPLACE AXIOS PAR TON INSTANCE PERSONNALISÉE
import api from "../../../api"; 
import {
  Box, Typography, useTheme, alpha, Button, Grid, Paper,
  TextField, MenuItem, Stack, Snackbar, Alert, Autocomplete,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from "@mui/material";
import {
  BalanceOutlined, DescriptionOutlined, UploadFileOutlined,
  SaveOutlined, ArrowBackOutlined, GavelOutlined, SearchOutlined
} from "@mui/icons-material";

// COULEURS OFFICIELLES RDC
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1021";

const TYPE_DOC_CHOICES = [
  { value: "MAP", label: "Mandat d'Arrêt Provisoire" },
  { value: "ODP", label: "Ordonnance de Détention Préventive" },
  { value: "JUGEMENT", label: "Jugement de Condamnation" },
  { value: "ARRET", label: "Arrêt de Justice/Appel" },
  { value: "LRP", label: "Levée de l'Écrou" },
];

const GestionJudiciaire = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { detenuId } = useParams(); // ID du détenu passé dans l'URL
  
  const isDark = theme.palette.mode === "dark";
  const bc = isDark ? "#fff" : "#000";

  // --- ÉTATS ---
  const [listeDetenus, setListeDetenus] = useState([]); // Pour l'Autocomplete
  const [parquets, setParquets] = useState([]);
  const [tribunaux, setTribunaux] = useState([]); // Ajout de l'état des tribunaux
  const [documents, setDocuments] = useState([]);
  const [nomDetenu, setNomDetenu] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", type: "success" });

  // État du Dossier Judiciaire
  const [dossier, setDossier] = useState({
    numero_rmp: "", numero_rp: "", parquet_origine: "",
    tribunal_saisi: "", magistrat_instructeur: "",
    chef_inculpation: "", peine_prononcee: "",
    date_faits: "", date_jugement: "", date_expiration_peine: ""
  });

  // État du Modal d'Ajout de Document
  const [openDocModal, setOpenDocModal] = useState(false);
  const [newDoc, setNewDoc] = useState({
    type_document: "MAP", numero_document: "", parquet_emetteur: "",
    date_emission: "", date_expiration: "", fichier_scanne: null
  });

  // --- CHARGEMENT INITIAL ---
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        // 1. Charger les parquets, les tribunaux et les détenus en parallèle avec `api`
        const [resParquets, resTribunaux, resListe] = await Promise.all([
          api.get("parquets/"),
          api.get("tribunaux/"),
          api.get("detenus/")
        ]);
        
        setParquets(resParquets.data);
        setTribunaux(resTribunaux.data);
        setListeDetenus(resListe.data);

        // 2. Charger les détails du dossier SI un détenu est sélectionné
        if (detenuId && detenuId !== "undefined") {
          chargerDetailsDetenu(detenuId);
        }
      } catch (err) {
        console.error("Erreur d'initialisation", err);
        showMessage("Erreur de connexion au serveur", "error");
      }
    };
    fetchInitial();
  }, [detenuId]);

  // Fonction pour charger le dossier d'un détenu spécifique
  const chargerDetailsDetenu = async (id) => {
    try {
      const resDetenu = await api.get(`detenus/${id}/`);
      setNomDetenu(`${resDetenu.data.nom} ${resDetenu.data.postnom}`);
      
      if (resDetenu.data.dossier_judiciaire) {
        setDossier(resDetenu.data.dossier_judiciaire);
      } else {
        // Vider le formulaire si le détenu n'a pas encore de dossier
        setDossier({
          numero_rmp: "", numero_rp: "", parquet_origine: "", tribunal_saisi: "", magistrat_instructeur: "",
          chef_inculpation: "", peine_prononcee: "", date_faits: "", date_jugement: "", date_expiration_peine: ""
        });
      }
      
      const resDocs = await api.get(`documents-ecrou/?detenu=${id}`);
      setDocuments(resDocs.data);

    } catch (err) {
      console.error(err);
      showMessage("Erreur lors du chargement du dossier", "error");
    }
  };

  // --- HANDLERS DOSSIER ---
  const handleDossierChange = (e) => {
    const { name, value } = e.target;
    let updatedDossier = { ...dossier, [name]: value };

    // MAGIE ICI : Auto-remplissage du tribunal si on choisit un parquet
    if (name === "parquet_origine" && value) {
      const selectedParquet = parquets.find(p => p.id === value);
      if (selectedParquet && selectedParquet.tribunal) {
        updatedDossier.tribunal_saisi = selectedParquet.tribunal;
      }
    }

    setDossier(updatedDossier);
  };

  const sauvegarderDossier = async () => {
    try {
      if (dossier.id) {
        await api.put(`dossiers-judiciaires/${dossier.id}/`, { ...dossier, detenu: detenuId });
      } else {
        await api.post(`dossiers-judiciaires/`, { ...dossier, detenu: detenuId });
      }
      showMessage("Dossier judiciaire mis à jour avec succès.", "success");
    } catch (err) {
      console.error(err);
      showMessage("Erreur lors de la sauvegarde du dossier.", "error");
    }
  };

  // --- HANDLERS DOCUMENTS ---
  const handleDocChange = (e) => {
    setNewDoc({ ...newDoc, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setNewDoc({ ...newDoc, fichier_scanne: e.target.files[0] });
  };

  const ajouterDocument = async () => {
    if (!newDoc.fichier_scanne) {
      showMessage("Veuillez joindre le fichier scanné (PDF/Image).", "error");
      return;
    }

    const formData = new FormData();
    formData.append("detenu", detenuId);
    formData.append("type_document", newDoc.type_document);
    formData.append("numero_document", newDoc.numero_document);
    formData.append("parquet_emetteur", newDoc.parquet_emetteur);
    formData.append("date_emission", newDoc.date_emission);
    if (newDoc.date_expiration) formData.append("date_expiration", newDoc.date_expiration);
    formData.append("fichier_scanne", newDoc.fichier_scanne);

    try {
      const res = await api.post("documents-ecrou/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setDocuments([res.data, ...documents]);
      setOpenDocModal(false);
      setNewDoc({ type_document: "MAP", numero_document: "", parquet_emetteur: "", date_emission: "", date_expiration: "", fichier_scanne: null });
      showMessage("Document d'écrou enregistré.", "success");
    } catch (err) {
      console.error(err);
      showMessage("Erreur lors de l'enregistrement du document.", "error");
    }
  };

  const showMessage = (msg, type) => setSnackbar({ open: true, msg, type });
  const fieldStyle = { "& .MuiFilledInput-root": { borderRadius: 0, bgcolor: alpha(bc, 0.05) }, mb: 2 };

  // Retrouver le détenu actuellement sélectionné pour l'Autocomplete
  const selectedDetenu = listeDetenus.find(d => d.id === parseInt(detenuId)) || null;

  return (
    <Box sx={{ p: 4, bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={4} sx={{ borderBottom: `4px solid ${bc}`, pb: 2, position: "relative" }}>
        <Box sx={{ position: "absolute", bottom: -4, left: 0, width: "100%", height: "4px", display: "flex" }}>
          <Box sx={{ flex: 1, bgcolor: RDC_BLUE }} /><Box sx={{ flex: 1, bgcolor: RDC_YELLOW }} /><Box sx={{ flex: 1, bgcolor: RDC_RED }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: "-1px" }}>DOSSIER JUDICIAIRE & ÉCROUS</Typography>
          <Typography variant="h6" fontWeight={800} sx={{ color: RDC_BLUE }}>
            {detenuId && detenuId !== "undefined" ? `DÉTENU : ${nomDetenu.toUpperCase()}` : "SÉLECTION REQUISE"}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/detenus/liste')} startIcon={<ArrowBackOutlined />} sx={{ border: `2px solid ${bc}`, color: bc, fontWeight: 900, borderRadius: 0 }}>
          RETOUR LISTE
        </Button>
      </Box>

      {/* BARRE DE RECHERCHE INTELLIGENTE (AUTOCOMPLETE) */}
      <Paper sx={{ p: 3, mb: 4, border: `2px solid ${RDC_YELLOW}`, borderRadius: 0, bgcolor: alpha(RDC_YELLOW, 0.05) }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="center">
          <Typography variant="subtitle1" fontWeight={900} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SearchOutlined /> RECHERCHER UN DÉTENU :
          </Typography>
          
          <Autocomplete
            fullWidth
            options={listeDetenus}
            getOptionLabel={(option) => `${option.matricule || 'Sans Mat.'} - ${option.nom?.toUpperCase()} ${option.postnom} ${option.prenom}`}
            value={selectedDetenu}
            onChange={(event, newValue) => {
              if (newValue) {
                navigate(`/detenus/juridique/${newValue.id}`);
              } else {
                navigate(`/detenus/juridique/undefined`);
              }
            }}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Tapez un nom ou un matricule..." 
                variant="outlined" 
                sx={{ bgcolor: theme.palette.background.paper, "& .MuiOutlinedInput-root": { borderRadius: 0 } }} 
              />
            )}
          />
        </Stack>
      </Paper>

      {/* AFFICHAGE CONDITIONNEL : Si pas de détenu sélectionné, on bloque la suite */}
      {(!detenuId || detenuId === "undefined") ? (
        <Box sx={{ textAlign: "center", py: 10, border: `2px dashed ${alpha(bc, 0.2)}` }}>
           <BalanceOutlined sx={{ fontSize: 60, color: alpha(bc, 0.1), mb: 2 }} />
           <Typography variant="h5" color="textSecondary" fontWeight={800}>
             VEUILLEZ RECHERCHER ET SÉLECTIONNER UN DÉTENU CI-DESSUS
           </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {/* COLONNE GAUCHE : DOSSIER JUDICIAIRE */}
          <Grid item xs={12} lg={7}>
            <Paper sx={{ p: 4, border: `2px solid ${bc}`, borderRadius: 0, boxShadow: "none" }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={900} sx={{ display: "flex", alignItems: "center", gap: 1, color: RDC_RED }}>
                  <BalanceOutlined /> INFORMATIONS DU DOSSIER
                </Typography>
                <Button variant="contained" onClick={sauvegarderDossier} startIcon={<SaveOutlined />} sx={{ bgcolor: RDC_RED, borderRadius: 0, fontWeight: 900 }}>
                  SAUVEGARDER
                </Button>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}><TextField fullWidth name="numero_rmp" value={dossier.numero_rmp || ""} label="N° R.M.P (Parquet)" variant="filled" onChange={handleDossierChange} sx={fieldStyle} InputProps={{ disableUnderline: true }} /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth name="numero_rp" value={dossier.numero_rp || ""} label="N° R.P (Tribunal)" variant="filled" onChange={handleDossierChange} sx={fieldStyle} InputProps={{ disableUnderline: true }} /></Grid>
                
                {/* PARQUET ET TRIBUNAL */}
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth name="parquet_origine" label="PARQUET D'ORIGINE" value={dossier.parquet_origine || ""} onChange={handleDossierChange} variant="filled" sx={fieldStyle} InputProps={{ disableUnderline: true }}>
                    <MenuItem value="">Aucun</MenuItem>
                    {parquets.map((p) => <MenuItem key={p.id} value={p.id}>{p.nom}</MenuItem>)}
                  </TextField>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth name="tribunal_saisi" label="TRIBUNAL SAISI" value={dossier.tribunal_saisi || ""} onChange={handleDossierChange} variant="filled" sx={fieldStyle} InputProps={{ disableUnderline: true }}>
                    <MenuItem value="">Aucun</MenuItem>
                    {tribunaux.map((t) => <MenuItem key={t.id} value={t.id}>{t.nom}</MenuItem>)}
                  </TextField>
                </Grid>
                
                <Grid item xs={12} md={4}><TextField fullWidth name="magistrat_instructeur" value={dossier.magistrat_instructeur || ""} label="MAGISTRAT INSTRUCTEUR" variant="filled" onChange={handleDossierChange} sx={fieldStyle} InputProps={{ disableUnderline: true }} /></Grid>

                <Grid item xs={12}><TextField fullWidth multiline rows={2} name="chef_inculpation" value={dossier.chef_inculpation || ""} label="CHEF D'INCULPATION / PRÉVENTIONS" variant="filled" onChange={handleDossierChange} sx={fieldStyle} InputProps={{ disableUnderline: true }} /></Grid>
                <Grid item xs={12}><TextField fullWidth name="peine_prononcee" value={dossier.peine_prononcee || ""} label="PEINE PRONONCÉE (Si Condamné)" variant="filled" onChange={handleDossierChange} sx={fieldStyle} InputProps={{ disableUnderline: true, startAdornment: <GavelOutlined sx={{mr:1}}/> }} /></Grid>

                <Grid item xs={12} md={4}><TextField fullWidth type="date" name="date_faits" value={dossier.date_faits || ""} label="DATE DES FAITS" onChange={handleDossierChange} variant="filled" InputLabelProps={{ shrink: true }} sx={fieldStyle} InputProps={{ disableUnderline: true }} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth type="date" name="date_jugement" value={dossier.date_jugement || ""} label="DATE DU JUGEMENT" onChange={handleDossierChange} variant="filled" InputLabelProps={{ shrink: true }} sx={fieldStyle} InputProps={{ disableUnderline: true }} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth type="date" name="date_expiration_peine" value={dossier.date_expiration_peine || ""} label="DATE DE LIBÉRATION PRÉVUE" onChange={handleDossierChange} variant="filled" InputLabelProps={{ shrink: true }} sx={fieldStyle} InputProps={{ disableUnderline: true }} /></Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* COLONNE DROITE : DOCUMENTS D'ÉCROU */}
          <Grid item xs={12} lg={5}>
            <Paper sx={{ p: 4, border: `2px solid ${bc}`, borderRadius: 0, boxShadow: "none", height: "100%", display: "flex", flexDirection: "column" }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={900} sx={{ display: "flex", alignItems: "center", gap: 1, color: RDC_BLUE }}>
                  <DescriptionOutlined /> ARCHIVES DES ÉCROUS
                </Typography>
                <Button variant="contained" onClick={() => setOpenDocModal(true)} startIcon={<UploadFileOutlined />} sx={{ bgcolor: RDC_BLUE, borderRadius: 0, fontWeight: 900 }}>
                  AJOUTER DOC
                </Button>
              </Box>

              <TableContainer sx={{ flexGrow: 1, border: `1px solid ${alpha(bc, 0.2)}` }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: alpha(bc, 0.05) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>TYPE & RÉF</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>DATES</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>ACTION</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents.length === 0 ? (
                      <TableRow><TableCell colSpan={3} align="center">Aucun document enregistré.</TableCell></TableRow>
                    ) : (
                      documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={800}>{doc.type_document}</Typography>
                            <Typography variant="caption" color="textSecondary">Réf: {doc.numero_document}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" display="block">Émis: {doc.date_emission}</Typography>
                            {doc.date_expiration && (
                              <Chip size="small" label={`Exp: ${doc.date_expiration}`} sx={{ height: 20, fontSize: "10px", bgcolor: alpha(RDC_RED, 0.1), color: RDC_RED, fontWeight: 800 }} />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="text" href={doc.fichier_scanne} target="_blank" sx={{ color: RDC_BLUE, fontWeight: 900 }}>VOIR PDF</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* MODAL : AJOUT DE DOCUMENT */}
      <Dialog open={openDocModal} onClose={() => setOpenDocModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 0, border: `2px solid ${bc}` } }}>
        <DialogTitle sx={{ fontWeight: 900, bgcolor: alpha(bc, 0.05) }}>AJOUTER UN TITRE DE DÉTENTION</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField select fullWidth name="type_document" label="TYPE DE DOCUMENT" value={newDoc.type_document} onChange={handleDocChange} variant="filled" sx={fieldStyle} InputProps={{ disableUnderline: true }}>
                {TYPE_DOC_CHOICES.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth name="numero_document" label="RÉFÉRENCE (N° Doc)" value={newDoc.numero_document} onChange={handleDocChange} variant="filled" sx={fieldStyle} InputProps={{ disableUnderline: true }} /></Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth name="parquet_emetteur" label="PARQUET ÉMETTEUR" value={newDoc.parquet_emetteur} onChange={handleDocChange} variant="filled" sx={fieldStyle} InputProps={{ disableUnderline: true }}>
                <MenuItem value="">Aucun</MenuItem>
                {parquets.map((p) => <MenuItem key={p.id} value={p.id}>{p.nom}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth type="date" name="date_emission" label="DATE DE SIGNATURE" value={newDoc.date_emission} onChange={handleDocChange} variant="filled" InputLabelProps={{ shrink: true }} sx={fieldStyle} InputProps={{ disableUnderline: true }} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth type="date" name="date_expiration" label="DATE D'EXPIRATION (Optionnel)" value={newDoc.date_expiration} onChange={handleDocChange} variant="filled" InputLabelProps={{ shrink: true }} sx={fieldStyle} InputProps={{ disableUnderline: true }} helperText="Crucial pour les MAP/ODP" /></Grid>
            
            <Grid item xs={12}>
              <Button fullWidth component="label" variant="outlined" startIcon={<UploadFileOutlined />} sx={{ border: `2px dashed ${bc}`, color: bc, py: 2, borderRadius: 0, fontWeight: 900 }}>
                {newDoc.fichier_scanne ? newDoc.fichier_scanne.name : "IMPORTER LE FICHIER SCANNÉ (PDF/IMG)"}
                <input type="file" hidden accept=".pdf,image/*" onChange={handleFileChange} />
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDocModal(false)} sx={{ color: bc, fontWeight: 900 }}>ANNULER</Button>
          <Button onClick={ajouterDocument} variant="contained" sx={{ bgcolor: RDC_BLUE, borderRadius: 0, fontWeight: 900 }}>ENREGISTRER LE DOCUMENT</Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR NOTIFICATIONS */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.type} sx={{ borderRadius: 0, fontWeight: 900 }}>{snackbar.msg}</Alert>
      </Snackbar>

    </Box>
  );
};

export default GestionJudiciaire;