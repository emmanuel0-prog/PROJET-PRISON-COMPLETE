import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box, Typography, useTheme, alpha, Button, Grid, Paper,
  TextField, MenuItem, Stack, Snackbar, Alert, Autocomplete,
  FormGroup, FormControlLabel, Checkbox, Divider, Card, CardContent, Avatar
} from "@mui/material";
import {
  ArrowBackOutlined, SearchOutlined, ExitToAppOutlined,
  GavelOutlined, UploadFileOutlined, FactCheckOutlined,
  InsertChartOutlined, CalculateOutlined, GroupOutlined,
  HistoryEduOutlined, BalanceOutlined
} from "@mui/icons-material";

// --- CONFIGURATION IDENTITAIRE RDC ---
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1021";
const SUCCESS_GREEN = "#2E7D32";

const MOTIFS_LIBERATION = [
  { value: "ACQUITTEMENT", label: "Jugement de relaxe ou d'acquittement" },
  { value: "CLASSEMENT", label: "Classement sans suite / Extinction" },
  { value: "LIBERTE_PROVISOIRE", label: "Ordonnance de mise en liberté provisoire" },
  { value: "FIN_PEINE", label: "Fin de peine (Expiration du quantum)" },
  { value: "LIBERATION_CONDITIONNELLE", label: "Libération conditionnelle" },
  { value: "GRACE", label: "Grâce présidentielle" },
  { value: "AMNISTIE", label: "Amnistie" },
  { value: "ANNULATION", label: "Annulation de la procédure (Appel/Cassation)" },
  { value: "DETENTION_IRREGULIERE", label: "Erreur ou détention irrégulière" },
];

const LiberationDetenu = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { detenuId } = useParams();
  const isDark = theme.palette.mode === "dark";
  const bc = isDark ? "#fff" : "#000";

  // --- ÉTATS ---
  const [listeDetenus, setListeDetenus] = useState([]);
  const [detenuData, setDetenuData] = useState(null);
  const [stats, setStats] = useState({ actifs: 0, prevenus: 0, condamnes: 0 });
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", type: "success" });

  // Formulaire de libération
  const [form, setForm] = useState({
    motif: "",
    date_liberation: new Date().toISOString().split("T")[0],
    autorite: "",
    observations: "",
  });

  // Calculateur de peine
  const [peine, setPeine] = useState({ ans: 0, mois: 0, jours: 0 });

  // Fichiers et Workflow
  const [files, setFiles] = useState({ oml: null, jugement: null });
  const [workflow, setWorkflow] = useState({ juri: false, parquet: false, greffe: false, restitution: false });

  // --- CHARGEMENT ---
  useEffect(() => {
    fetchInitialData();
  }, [detenuId]);

  const fetchInitialData = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/detenus/");
      const actifs = res.data.filter(d => d.statut_juridique !== 'LIBERE' && d.etat !== 'ABSENT');
      setListeDetenus(actifs);

      // Calcul des statistiques pour le bandeau supérieur
      setStats({
        actifs: actifs.length,
        prevenus: actifs.filter(d => d.statut_juridique.includes('PREVENU')).length,
        condamnes: actifs.filter(d => d.statut_juridique.includes('CONDAMNE')).length
      });

      if (detenuId && detenuId !== "undefined") {
        const detail = await axios.get(`http://127.0.0.1:8000/api/detenus/${detenuId}/`);
        setDetenuData(detail.data);
      }
    } catch (err) {
      console.error("Erreur de chargement", err);
    }
  };

  // --- LOGIQUE DE CALCUL DE DATE ---
  const handlePeineCalculation = (field, value) => {
    const newVal = parseInt(value) || 0;
    const updatePeine = { ...peine, [field]: newVal };
    setPeine(updatePeine);

    if (detenuData?.date_entree) {
      const dateSortie = new Date(detenuData.date_entree);
      dateSortie.setFullYear(dateSortie.getFullYear() + updatePeine.ans);
      dateSortie.setMonth(dateSortie.getMonth() + updatePeine.mois);
      dateSortie.setDate(dateSortie.getDate() + updatePeine.jours);
      setForm({ ...form, date_liberation: dateSortie.toISOString().split("T")[0] });
    }
  };

  const handleActionFinal = async () => {
    if (!form.motif) return showMsg("Sélectionnez un motif valide", "error");
    if (!workflow.parquet) return showMsg("L'OML (Phase Parquet) est obligatoire pour libérer", "error");

    try {
      // Simulation d'envoi API
      // await axios.post(`http://127.0.0.1:8000/api/detenus/${detenuId}/liberer/`, { ...form, workflow });
      showMsg("LIBÉRATION ENREGISTRÉE. Le détenu est désormais radié de l'écrou.", "success");
      setTimeout(() => navigate("/detenus/liste"), 2000);
    } catch (err) {
      showMsg("Erreur lors de la validation finale", "error");
    }
  };

  const showMsg = (msg, type) => setSnackbar({ open: true, msg, type });

  // Styles réutilisables
  const paperStyle = { p: 4, border: `2px solid ${bc}`, borderRadius: 0, boxShadow: "none", height: "100%" };

  return (
    <Box sx={{ p: 4, bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      
      {/* HEADER OFFICIEL */}
      <Box sx={{ borderBottom: `4px solid ${bc}`, pb: 2, mb: 4, position: "relative" }}>
        <Box sx={{ position: "absolute", bottom: -4, left: 0, width: "100%", height: "4px", display: "flex" }}>
          <Box sx={{ flex: 1, bgcolor: RDC_BLUE }} /><Box sx={{ flex: 1, bgcolor: RDC_YELLOW }} /><Box sx={{ flex: 1, bgcolor: RDC_RED }} />
        </Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-2px" }}>PROCÉDURE DE LIBÉRATION</Typography>
            <Typography variant="h6" fontWeight={800} color={RDC_BLUE}>MINISTÈRE DE LA JUSTICE - SERVICES PÉNITENTIAIRES</Typography>
          </Box>
          <Button variant="outlined" onClick={() => navigate(-1)} startIcon={<ArrowBackOutlined />} sx={{ border: `2px solid ${bc}`, color: bc, fontWeight: 900, borderRadius: 0 }}>
            RETOUR LISTE
          </Button>
        </Stack>
      </Box>

      {/* SECTION STATISTIQUES */}
      <Grid container spacing={3} mb={4}>
        {[
          { label: "DÉTENUS ACTIFS", val: stats.actifs, color: bc, icon: <GroupOutlined /> },
          { label: "RÉGIME PRÉVENTIF", val: stats.prevenus, color: RDC_BLUE, icon: <BalanceOutlined /> },
          { label: "RÉGIME CONDAMNÉ", val: stats.condamnes, color: RDC_RED, icon: <GavelOutlined /> }
        ].map((item, idx) => (
          <Grid item xs={12} md={4} key={idx}>
            <Paper sx={{ p: 3, border: `2px solid ${item.color}`, borderRadius: 0, bgcolor: alpha(item.color, 0.04), display: "flex", alignItems: "center", gap: 3 }}>
              <Avatar sx={{ bgcolor: item.color, width: 56, height: 56, borderRadius: 0 }}>{item.icon}</Avatar>
              <Box>
                <Typography variant="h3" fontWeight={900} lineHeight={1}>{item.val}</Typography>
                <Typography variant="subtitle2" fontWeight={800} sx={{ opacity: 0.7 }}>{item.label}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* BARRE DE RECHERCHE DYNAMIQUE */}
      <Paper sx={{ p: 2, mb: 4, bgcolor: RDC_YELLOW, borderRadius: 0, border: `2px solid ${bc}` }}>
        <Autocomplete
          options={listeDetenus}
          getOptionLabel={(o) => `${o.matricule} - ${o.nom.toUpperCase()} ${o.postnom} (${o.statut_juridique})`}
          value={listeDetenus.find(d => d.id === parseInt(detenuId)) || null}
          onChange={(e, v) => navigate(v ? `/detenus/liberation/${v.id}` : "/detenus/liberation/undefined")}
          renderInput={(params) => (
            <TextField {...params} placeholder="RECHERCHER UN DÉTENU PAR NOM OU MATRICULE..." variant="outlined" sx={{ bgcolor: "#fff" }} />
          )}
        />
      </Paper>

      {!detenuData ? (
        <Box sx={{ textAlign: "center", py: 10, border: `3px dashed ${alpha(bc, 0.1)}` }}>
          <ExitToAppOutlined sx={{ fontSize: 100, color: alpha(bc, 0.1), mb: 2 }} />
          <Typography variant="h4" fontWeight={900} color="textSecondary">VEUILLEZ SÉLECTIONNER UN DOSSIER CI-DESSUS</Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          
          {/* COLONNE GAUCHE : DOSSIER JURIDIQUE */}
          <Grid item xs={12} lg={7}>
            <Paper sx={paperStyle}>
              <Typography variant="h5" fontWeight={900} color={RDC_BLUE} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <HistoryEduOutlined fontSize="large" /> FONDEMENT JURIDIQUE DE LA SORTIE
              </Typography>
              <Divider sx={{ mb: 4, borderWidth: 2, borderColor: bc }} />

              <Stack spacing={3}>
                <TextField select fullWidth label="MOTIF DE LIBÉRATION" value={form.motif} onChange={(e) => setForm({...form, motif: e.target.value})} variant="filled" InputProps={{ disableUnderline: true }}>
                  {MOTIFS_LIBERATION.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                </TextField>

                {/* CALCULATEUR SI FIN DE PEINE */}
                {form.motif === "FIN_PEINE" && (
                  <Card sx={{ borderRadius: 0, border: `1px solid ${SUCCESS_GREEN}`, bgcolor: alpha(SUCCESS_GREEN, 0.05) }}>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={900} color={SUCCESS_GREEN} mb={2} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CalculateOutlined /> CALCUL DU QUANTUM (ENTRÉE LE : {detenuData.date_entree})
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={4}><TextField label="Années" type="number" fullWidth size="small" onChange={(e) => handlePeineCalculation('ans', e.target.value)} /></Grid>
                        <Grid item xs={4}><TextField label="Mois" type="number" fullWidth size="small" onChange={(e) => handlePeineCalculation('mois', e.target.value)} /></Grid>
                        <Grid item xs={4}><TextField label="Jours" type="number" fullWidth size="small" onChange={(e) => handlePeineCalculation('jours', e.target.value)} /></Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth type="date" label="DATE DE LIBÉRATION EFFECTIVE" value={form.date_liberation} onChange={(e) => setForm({...form, date_liberation: e.target.value})} InputLabelProps={{ shrink: true }} variant="filled" InputProps={{ disableUnderline: true }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="AUTORITÉ ORDONNANTE" placeholder="ex: Parquet de Grande Instance" value={form.autorite} onChange={(e) => setForm({...form, autorite: e.target.value})} variant="filled" InputProps={{ disableUnderline: true }} />
                  </Grid>
                </Grid>

                <TextField fullWidth multiline rows={4} label="OBSERVATIONS DU GREFFIER" value={form.observations} onChange={(e) => setForm({...form, observations: e.target.value})} variant="filled" InputProps={{ disableUnderline: true }} />
              </Stack>
            </Paper>
          </Grid>

          {/* COLONNE DROITE : CHAÎNE DE VALIDATION */}
          <Grid item xs={12} lg={5}>
            <Paper sx={{ ...paperStyle, borderLeft: `8px solid ${RDC_RED}` }}>
              <Typography variant="h5" fontWeight={900} color={RDC_RED} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FactCheckOutlined fontSize="large" /> CHAÎNE OPÉRATIONNELLE
              </Typography>
              <Divider sx={{ mb: 4 }} />

              {/* UPLOAD OML */}
              <Box sx={{ p: 3, mb: 4, bgcolor: alpha(RDC_RED, 0.05), border: `2px dashed ${RDC_RED}`, textAlign: "center" }}>
                <Typography variant="subtitle2" fontWeight={900} mb={2}>ORDRE DE MISE EN LIBERTÉ (OML) - SCAN PDF</Typography>
                <Button component="label" variant="contained" startIcon={<UploadFileOutlined />} sx={{ bgcolor: RDC_RED, borderRadius: 0, fontWeight: 900 }}>
                  {files.oml ? files.oml.name : "JOINDRE L'OML SIGNÉ"}
                  <input type="file" hidden onChange={(e) => setFiles({...files, oml: e.target.files[0]})} />
                </Button>
              </Box>

              <Typography variant="h6" fontWeight={900} mb={2}>CHECKLIST ADMINISTRATIVE :</Typography>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={workflow.juri} onChange={(e) => setWorkflow({...workflow, juri: e.target.checked})} />} label={<Typography fontWeight={700}>1. Phase Juridictionnelle (Titre valide)</Typography>} />
                <FormControlLabel control={<Checkbox checked={workflow.parquet} onChange={(e) => setWorkflow({...workflow, parquet: e.target.checked})} />} label={<Typography fontWeight={700}>2. Phase Parquet (OML reçu et authentifié)</Typography>} />
                <FormControlLabel control={<Checkbox checked={workflow.greffe} onChange={(e) => setWorkflow({...workflow, greffe: e.target.checked})} />} label={<Typography fontWeight={700}>3. Greffe Pénitentiaire (Radiation écrou)</Typography>} />
                <FormControlLabel control={<Checkbox checked={workflow.restitution} onChange={(e) => setWorkflow({...workflow, restitution: e.target.checked})} />} label={<Typography fontWeight={700}>4. Restitution des effets personnels</Typography>} />
              </FormGroup>

              <Box sx={{ mt: "auto", pt: 4 }}>
                <Button 
                  fullWidth 
                  variant="contained" 
                  size="large"
                  onClick={handleActionFinal}
                  disabled={!workflow.parquet || !workflow.greffe}
                  sx={{ 
                    py: 2, borderRadius: 0, fontWeight: 900, fontSize: "1.2rem",
                    bgcolor: SUCCESS_GREEN, "&:hover": { bgcolor: "#1b5e20" }
                  }}
                >
                  VALIDER LA LIBÉRATION DÉFINITIVE
                </Button>
                <Typography variant="caption" sx={{ mt: 1, display: "block", textAlign: "center", fontWeight: 700, opacity: 0.6 }}>
                  Cette action est irréversible et clôture le dossier d'écrou.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* NOTIFICATIONS */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({...snackbar, open: false})}>
        <Alert severity={snackbar.type} sx={{ fontWeight: 900, borderRadius: 0, border: `2px solid ${bc}` }}>
          {snackbar.msg}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default LiberationDetenu;