import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import QRCode from "react-qr-code";
import {
  Box, Typography, useTheme, alpha, Button, Grid, Paper,
  TextField, MenuItem, Stack, Snackbar, Alert, Autocomplete,
  FormGroup, FormControlLabel, Checkbox, Divider, Card, CardContent, 
  Avatar, CircularProgress, Dialog, DialogContent, DialogActions
} from "@mui/material";
import {
  ArrowBackOutlined, PrintOutlined, GavelOutlined, 
  FactCheckOutlined, GroupOutlined, HistoryEduOutlined, BalanceOutlined
} from "@mui/icons-material";

// --- IMPORT DES IMAGES ---
import sceauRdc from "../../../assets/gouvernement rdc.png";
import drapeauRdc from "../../../assets/rdc.png";

import api from "../../../api";

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
  const bc = theme.palette.text.primary;

  // --- ÉTATS ---
  const [listeDetenus, setListeDetenus] = useState([]);
  const [parquets, setParquets] = useState([]); 
  const [detenuData, setDetenuData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ actifs: 0, prevenus: 0, condamnes: 0 });
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", type: "success" });
  const [openPrint, setOpenPrint] = useState(false);

  // Formulaire
  const [form, setForm] = useState({
    motif: "",
    date_liberation: new Date().toISOString().split("T")[0],
    autorite: "",
    observations: "",
  });

  const [peine, setPeine] = useState({ ans: 0, mois: 0, jours: 0 });
  const [files, setFiles] = useState({ oml: null });
  const [workflow, setWorkflow] = useState({ juri: false, parquet: false, greffe: false, restitution: false });

  const showMsg = (msg, type) => setSnackbar({ open: true, msg, type });

  // --- CHARGEMENT INITIAL ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resDetenus, resParquets] = await Promise.all([
          api.get("http://127.0.0.1:8000/api/detenus/"),
          api.get("http://127.0.0.1:8000/api/parquets/")
        ]);
        const actifs = resDetenus.data.filter(d => d.statut_juridique !== 'LIBERE' && !d.est_supprime);
        setListeDetenus(actifs);
        setParquets(resParquets.data);
        setStats({
          actifs: actifs.length,
          prevenus: actifs.filter(d => d.statut_juridique?.includes('PREVENU')).length,
          condamnes: actifs.filter(d => d.statut_juridique?.includes('CONDAMNE')).length
        });
      } catch (err) {
        showMsg("Erreur de connexion", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- CHARGEMENT DU DÉTENU SÉLECTIONNÉ ---
  useEffect(() => {
    if (detenuId && detenuId !== "undefined") {
      api.get(`http://127.0.0.1:8000/api/detenus/${detenuId}/`)
        .then(res => setDetenuData(res.data))
        .catch(() => {
          // Fallback si API échoue : on cherche dans la liste déjà chargée
          const found = listeDetenus.find(d => String(d.id) === String(detenuId));
          if (found) setDetenuData(found);
          else setDetenuData(null);
        });
    } else {
      setDetenuData(null);
    }
  }, [detenuId, listeDetenus]);

  const handlePeineCalculation = (field, value) => {
    const newVal = parseInt(value) || 0;
    const updatePeine = { ...peine, [field]: newVal };
    setPeine(updatePeine);
    if (detenuData?.date_entree) {
      const dateSortie = new Date(detenuData.date_entree);
      dateSortie.setFullYear(dateSortie.getFullYear() + updatePeine.ans);
      dateSortie.setMonth(dateSortie.getMonth() + updatePeine.mois);
      dateSortie.setDate(dateSortie.getDate() + updatePeine.jours);
      setForm(prev => ({ ...prev, date_liberation: dateSortie.toISOString().split("T")[0] }));
    }
  };

  const handleActionFinal = async () => {
    // 🔥 ID SÉCURISÉ : On prend l'ID des données en priorité, sinon l'URL (en ignorant "undefined")
    const currentDetenuId = detenuData?.id || (detenuId !== "undefined" ? detenuId : null);

    // 🔥 VÉRIFICATION ROBUSTE
    if (!currentDetenuId) return showMsg("Veuillez d'abord sélectionner un détenu valide.", "error");
    if (!form.motif) return showMsg("Le motif de libération est obligatoire.", "error");
    if (!form.autorite) return showMsg("L'autorité ordonnante est obligatoire.", "error");
    if (!files.oml) return showMsg("Veuillez joindre le scan de l'OML.", "error");
    if (!workflow.parquet || !workflow.greffe) return showMsg("Veuillez valider les étapes obligatoires (Parquet et Greffe).", "error");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("motif", form.motif);
      formData.append("date_liberation", form.date_liberation);
      formData.append("autorite", form.autorite);
      formData.append("observations", form.observations);
      formData.append("workflow", JSON.stringify(workflow));
      formData.append("oml", files.oml);

      // 🔥 UTILISATION DU BON ID POUR L'API
      await api.post(`http://127.0.0.1:8000/api/detenus/${currentDetenuId}/liberer/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showMsg("Libération enregistrée avec succès !", "success");
      setOpenPrint(true); 
    } catch (err) {
      showMsg("Erreur lors de la validation", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const paperStyle = { p: 4, border: `2px solid ${alpha(bc, 0.2)}`, borderRadius: 0, boxShadow: "none", height: "100%" };

  // Données pour le QRCode
  const qrData = detenuData 
    ? `DÉTENU: ${detenuData.matricule} | NOM: ${detenuData.nom} ${detenuData.postnom} | MOTIF: ${form.motif} | DATE: ${form.date_liberation}` 
    : "Aucune donnée";

  return (
    <Box sx={{ p: 4, bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      
      {/* HEADER */}
      <Box sx={{ borderBottom: `4px solid ${bc}`, pb: 2, mb: 4, position: "relative" }}>
        <Box sx={{ position: "absolute", bottom: -4, left: 0, width: "100%", height: "4px", display: "flex" }}>
          <Box sx={{ flex: 1, bgcolor: RDC_BLUE }} /><Box sx={{ flex: 1, bgcolor: RDC_YELLOW }} /><Box sx={{ flex: 1, bgcolor: RDC_RED }} />
        </Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-2px" }}>PROCÉDURE DE LIBÉRATION</Typography>
            <Typography variant="h6" fontWeight={800} color={RDC_BLUE}>MINISTÈRE DE LA JUSTICE ET GARDE DES SCEAUX - RDC</Typography>
          </Box>
          <Button variant="outlined" onClick={() => navigate(-1)} startIcon={<ArrowBackOutlined />} sx={{ border: `2px solid ${bc}`, color: bc, fontWeight: 900, borderRadius: 0 }}>
            RETOUR
          </Button>
        </Stack>
      </Box>

      {/* STATS */}
      <Grid container spacing={2} mb={4}>
        {[
          { label: "DÉTENUS ACTIFS", val: stats.actifs, color: bc, icon: <GroupOutlined /> },
          { label: "PRÉVENTIFS", val: stats.prevenus, color: RDC_BLUE, icon: <BalanceOutlined /> },
          { label: "CONDAMNÉS", val: stats.condamnes, color: RDC_RED, icon: <GavelOutlined /> }
        ].map((item, idx) => (
          <Grid item xs={12} md={4} key={idx}>
            <Paper sx={{ p: 2, border: `1px solid ${alpha(item.color, 0.2)}`, borderRadius: 0, display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: item.color, borderRadius: 0 }}>{item.icon}</Avatar>
              <Box>
                <Typography variant="h5" fontWeight={900}>{loading ? "..." : item.val}</Typography>
                <Typography variant="caption" fontWeight={800} sx={{ opacity: 0.6 }}>{item.label}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* RECHERCHE */}
      <Paper sx={{ p: 1, mb: 4, bgcolor: alpha(bc, 0.05), borderRadius: 0, border: `1px solid ${alpha(bc, 0.2)}` }}>
        <Autocomplete
          options={listeDetenus}
          getOptionLabel={(o) => `${o.matricule || ''} - ${o.nom || ''} ${o.postnom || ''}`}
          value={listeDetenus.find(d => String(d.id) === String(detenuData?.id || detenuId)) || null}
          onChange={(e, v) => {
            if (v) {
              setDetenuData(v); // Mise à jour immédiate
              navigate(`/detenus/liberation/${v.id}`);
            } else {
              setDetenuData(null);
              // 🔥 Route plus propre quand on vide la sélection
              navigate("/detenus/liberation"); 
            }
          }}
          renderInput={(params) => (
            <TextField {...params} placeholder="RECHERCHER LE DÉTENU..." variant="standard" InputProps={{ ...params.InputProps, disableUnderline: true, sx: { px: 2, py: 1, fontWeight: 700 } }} />
          )}
        />
      </Paper>

      {/* FORMULAIRE ET OPÉRATIONS */}
      <Grid container spacing={4}>
        <Grid item xs={12} lg={7}>
          <Paper sx={paperStyle}>
            <Typography variant="h5" fontWeight={900} color={RDC_BLUE} mb={3} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <HistoryEduOutlined /> FONDEMENT JURIDIQUE
            </Typography>

            <Stack spacing={3}>
              {/* CHAMP EN LECTURE SEULE POUR LE DÉTENU */}
              <TextField 
                fullWidth 
                label="DÉTENU SÉLECTIONNÉ" 
                value={detenuData ? `Matricule: ${detenuData.matricule || 'N/A'} - ${detenuData.nom || ''} ${detenuData.postnom || ''}` : "Aucun détenu sélectionné"} 
                variant="filled" 
                InputProps={{ readOnly: true }}
                sx={{ input: { fontWeight: 900, color: RDC_BLUE } }}
              />

              <TextField select fullWidth label="MOTIF DE LIBÉRATION" value={form.motif} onChange={(e) => setForm({...form, motif: e.target.value})} variant="filled">
                {MOTIFS_LIBERATION.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
              </TextField>

              <Card variant="outlined" sx={{ borderRadius: 0 }}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={900} color={SUCCESS_GREEN} mb={2}>CALCUL DU QUANTUM</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}><TextField label="Ans" type="number" fullWidth size="small" onChange={(e) => handlePeineCalculation('ans', e.target.value)} /></Grid>
                    <Grid item xs={4}><TextField label="Mois" type="number" fullWidth size="small" onChange={(e) => handlePeineCalculation('mois', e.target.value)} /></Grid>
                    <Grid item xs={4}><TextField label="Jours" type="number" fullWidth size="small" onChange={(e) => handlePeineCalculation('jours', e.target.value)} /></Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth type="date" label="DATE DE LIBÉRATION" value={form.date_liberation} onChange={(e) => setForm({...form, date_liberation: e.target.value})} InputLabelProps={{ shrink: true }} variant="filled" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={parquets}
                    getOptionLabel={(o) => o.nom || ""}
                    onChange={(e, v) => setForm({...form, autorite: v ? v.nom : ""})}
                    renderInput={(params) => <TextField {...params} label="AUTORITÉ ORDONNANTE" variant="filled" />}
                  />
                </Grid>
              </Grid>
              <TextField fullWidth multiline rows={4} label="OBSERVATIONS" value={form.observations} onChange={(e) => setForm({...form, observations: e.target.value})} variant="filled" />
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper sx={{ ...paperStyle, borderLeft: `8px solid ${RDC_RED}` }}>
            <Typography variant="h5" fontWeight={900} color={RDC_RED} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FactCheckOutlined /> CHAÎNE OPÉRATIONNELLE
            </Typography>

            <Box sx={{ p: 3, mb: 4, border: `2px dashed ${RDC_RED}`, textAlign: "center", bgcolor: alpha(RDC_RED, 0.05) }}>
              <Typography variant="subtitle2" fontWeight={900} mb={2}>SCAN OML</Typography>
              <Button component="label" variant="contained" sx={{ bgcolor: RDC_RED, borderRadius: 0 }}>
                {files.oml ? files.oml.name : "CHARGER LE SCAN"}
                <input type="file" hidden accept="image/*,.pdf" onChange={(e) => setFiles({...files, oml: e.target.files[0]})} />
              </Button>
            </Box>

            <FormGroup>
              <FormControlLabel control={<Checkbox checked={workflow.juri} onChange={(e) => setWorkflow({...workflow, juri: e.target.checked})} />} label={<Typography fontWeight={700}>1. Phase Juridictionnelle</Typography>} />
              <FormControlLabel control={<Checkbox checked={workflow.parquet} onChange={(e) => setWorkflow({...workflow, parquet: e.target.checked})} />} label={<Typography fontWeight={700}>2. Phase Parquet (Requis) *</Typography>} />
              <FormControlLabel control={<Checkbox checked={workflow.greffe} onChange={(e) => setWorkflow({...workflow, greffe: e.target.checked})} />} label={<Typography fontWeight={700}>3. Greffe / Radiation (Requis) *</Typography>} />
              <FormControlLabel control={<Checkbox checked={workflow.restitution} onChange={(e) => setWorkflow({...workflow, restitution: e.target.checked})} />} label={<Typography fontWeight={700}>4. Restitutions</Typography>} />
            </FormGroup>

            <Box sx={{ mt: 5 }}>
              <Button 
                fullWidth variant="contained" size="large"
                onClick={handleActionFinal}
                disabled={submitting} 
                sx={{ py: 2, borderRadius: 0, fontWeight: 900, bgcolor: SUCCESS_GREEN, "&:hover": { bgcolor: "#1b5e20" } }}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : "VALIDER LA LIBÉRATION DÉFINITIVE"}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* MODAL D'IMPRESSION DU CERTIFICAT AVEC QR CODE ET IMAGES */}
      <Dialog open={openPrint} maxWidth="md" fullWidth onClose={() => setOpenPrint(false)}>
        <DialogContent id="printable-content" sx={{ p: 6 }}>
          <Box sx={{ border: "2px solid #000", p: 4 }}>
             
             {/* EN-TÊTE AVEC LOGOS */}
             <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Box sx={{ textAlign: "center", width: "120px" }}>
                  <img src={drapeauRdc} alt="Drapeau RDC" style={{ width: "80px", marginBottom: "8px" }} />
                  <Typography variant="caption" fontWeight={900} display="block">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <img src={sceauRdc} alt="Sceau RDC" style={{ width: "80px", marginBottom: "8px" }} />
                  <Typography variant="h5" fontWeight={900}>MINISTÈRE DE LA JUSTICE</Typography>
                  <Typography variant="subtitle1" fontWeight={800}>SERVICES PÉNITENTIAIRES</Typography>
                </Box>
                <Box sx={{ width: "120px", textAlign: "right" }}>
                  {/* Code QR */}
                  <QRCode value={qrData} size={80} level="M" />
                </Box>
             </Stack>

             <Divider sx={{ mb: 4, borderColor: "#000", borderWidth: "2px" }} />

             <Typography variant="h4" fontWeight={900} textAlign="center" my={3} sx={{ textDecoration: "underline" }}>
                CERTIFICAT DE LIBÉRATION
             </Typography>
             <Typography variant="h6" color={RDC_RED} fontWeight={900} textAlign="center" mb={4}>
                N° {new Date().getFullYear()}/{detenuData?.matricule || 'XXX'}
             </Typography>

             <Box sx={{ my: 4, px: 2 }}>
                <Typography variant="body1" paragraph fontSize="1.1rem">
                    Le Directeur de l'Établissement Pénitentiaire certifie par la présente que le détenu identifié ci-dessous a été officiellement élargi de l'établissement :
                </Typography>
                
                <Paper variant="outlined" sx={{ p: 3, my: 3, borderColor: "#000", borderRadius: 0 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}><Typography fontSize="1.1rem">Nom : <b>{detenuData?.nom}</b></Typography></Grid>
                    <Grid item xs={6}><Typography fontSize="1.1rem">Postnom/Prénom : <b>{detenuData?.postnom} {detenuData?.prenom}</b></Typography></Grid>
                    <Grid item xs={6}><Typography fontSize="1.1rem">Matricule d'écrou : <b>{detenuData?.matricule}</b></Typography></Grid>
                    <Grid item xs={6}><Typography fontSize="1.1rem">Date d'entrée : <b>{detenuData?.date_entree}</b></Typography></Grid>
                  </Grid>
                </Paper>

                <Typography variant="body1" paragraph fontSize="1.1rem">
                    Motif de libération : <b>{MOTIFS_LIBERATION.find(m => m.value === form.motif)?.label || form.motif}</b>
                </Typography>
                <Typography variant="body1" paragraph fontSize="1.1rem">
                    A été mis en liberté le <b>{form.date_liberation}</b> conformément à la décision émanant de : <b>{form.autorite}</b>.
                </Typography>
             </Box>

             <Stack direction="row" justifyContent="space-between" mt={10} px={4}>
                <Box sx={{ textAlign: 'center' }}>
                   <Typography variant="caption" fontWeight={900}>EMPREINTE DIGITALE DU LIBÉRÉ</Typography>
                   <Box sx={{ width: 100, height: 100, border: "2px solid #000", mt: 1, mx: "auto" }} />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                   <Typography fontWeight={900}>Fait à Kinshasa, le {new Date().toLocaleDateString()}</Typography>
                   <Typography fontWeight={900} sx={{ mt: 3 }}>LE GREFFIER TITULAIRE / LE DIRECTEUR</Typography>
                   <Box sx={{ height: 80 }} />
                   <Typography variant="caption">(Signature et Sceau de l'Établissement)</Typography>
                </Box>
             </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ "@media print": { display: "none" }, p: 3 }}>
           <Button variant="outlined" onClick={() => setOpenPrint(false)}>Fermer</Button>
           <Button variant="contained" startIcon={<PrintOutlined />} onClick={() => window.print()} sx={{ bgcolor: RDC_BLUE }}>Imprimer le Certificat</Button>
        </DialogActions>
      </Dialog>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-content, #printable-content * { visibility: visible; }
          #printable-content { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({...snackbar, open: false})}>
        <Alert severity={snackbar.type} variant="filled">{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default LiberationDetenu;