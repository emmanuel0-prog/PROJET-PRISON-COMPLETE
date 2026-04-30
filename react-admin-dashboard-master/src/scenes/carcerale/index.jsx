import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Box, Typography, useTheme, alpha, Button, Grid, Stack, Paper,
  IconButton, LinearProgress, Divider, AvatarGroup, Avatar, Chip, CircularProgress,
  Modal, Fade, Backdrop, Dialog, DialogTitle, DialogContent, Slide,
  TextField, Autocomplete, FormGroup, FormControlLabel, Checkbox, MenuItem, Snackbar, Alert, Card, CardContent
} from "@mui/material";
import {
  RestaurantOutlined, WorkOutline, ScheduleOutlined,
  Fingerprint, TimerOutlined, Refresh, GavelOutlined,
  DirectionsWalkOutlined, CloseOutlined,
  SearchOutlined, GavelOutlined as GavelIcon, LocalHospitalOutlined,
  PolicyOutlined, DownloadOutlined, PrintOutlined, CheckCircleOutline, DescriptionOutlined
} from "@mui/icons-material";
import { DataGrid, frFR, GridToolbarContainer, GridToolbarQuickFilter } from "@mui/x-data-grid";

// Exportation
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

// Tes imports d'images
import sceauRdc from "../../assets/gouvernement rdc.png";
import drapeauRdc from "../../assets/rdc.png";
import api from "../../api"; // Ton instance Axios

const DRC_BLUE = "#007FFF";
const DRC_YELLOW = "#F7D618";
const DRC_RED = "#CE1021";


const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// --- DONNÉES DE SECOURS (Si le backend est éteint) ---
const MOCK_DATA = {
  server_time: new Date().toLocaleTimeString(),
  planning: [
    { id: 1, heure_debut: "06:00", heure_fin: "07:30", label: "Réveil & Appel", est_actuelle: false, minutes_restantes: -1 },
    { id: 2, heure_debut: "07:30", heure_fin: "12:00", label: "Ateliers & Corvées", est_actuelle: true, minutes_restantes: 15 },
    { id: 3, heure_debut: "12:00", heure_fin: "13:30", label: "Restauration", est_actuelle: false, minutes_restantes: 0 },
  ],
  cantine: { servis: 412, total: 850, percent: 48 },
  corvees: [
    { id: 1, label: "Menuiserie Pénitentiaire", equipe: ["MK", "EL", "TS", "PL"], statut: "EN COURS" },
    { id: 2, label: "Entretien Cour Centrale", equipe: ["AM", "BK"], statut: "EN ATTENTE" }
  ]
};

const MOCK_MOUVEMENTS = [
    { id: 1, nom_detenu: "KABILA", postnom_detenu: "Joseph", destination: "TRIBUNAL", tribunal_details: { nom: "Tribunal de Grande Instance Gombe" }, motif: "[MANDAT_EXTRACTION N°123] - Audience", statut: "HORS MURS", escorte: "Sgt. Mabiala" },
    { id: 2, nom_detenu: "MUKENDI", postnom_detenu: "Paul", destination: "HÔPITAL", motif: "[ORDRE_SOINS N°45] - Urgence dentaire", statut: "RETOURNE", escorte: "Cpl. Ilunga" },
];

const DOCUMENTS_JUSTIFICATIFS = [
    { id: "MANDAT_AMENER", label: "Mandat d'Amener" },
    { id: "MANDAT_EXTRACTION", label: "Mandat d'Extraction" },
    { id: "REQUISITION_PARQUET", label: "Réquisition du Parquet" },
    { id: "ORDRE_SOINS", label: "Réquisition Médicale / Soins" },
];

const VieCarcerale = () => {
  const theme = useTheme();
  const bc = theme.palette.mode === "dark" ? "#fff" : "#000";
  const inv = theme.palette.mode === "dark" ? "#000" : "#fff";

  // États du Dashboard Principal
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openScan, setOpenScan] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const prevPlanningRef = useRef([]);

  // États de la Modale Mouvements
  const [openMouvements, setOpenMouvements] = useState(false);
  const [mouvementsRows, setMouvementsRows] = useState([]);
  const [tribunaux, setTribunaux] = useState([{id: 1, nom: "TGI Gombe"}, {id: 2, nom: "TGI Kalamu"}]); 
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  
  const [formMouv, setFormMouv] = useState({
    matricule: "", destination: "TRIBUNAL", tribunal: null, type_document: "MANDAT_EXTRACTION", 
    num_document: "", motif: "", escorte: "Sgt. ", mandat_verifie: false, ordre_mission_verifie: false
  });

  // --- AUDIO ALARME ---
  const playElectronicBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.3].forEach((delay) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + delay); 
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + 0.2);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start(audioCtx.currentTime + delay);
        oscillator.stop(audioCtx.currentTime + delay + 0.2);
      });
    } catch (e) { console.error("Audio bloqué"); }
  };

  // --- FETCH DASHBOARD PRINCIPAL ---
  const fetchDashboardData = async () => {
    try {
      const res = await api.get(`/vie-carcerale/`);
      processDashboardData(res.data);
    } catch (err) {
      console.warn("Backend injoignable, utilisation des données de secours.");
      processDashboardData(MOCK_DATA); // Fallback visuel
    } finally {
      setLoading(false);
    }
  };

  const processDashboardData = (newData) => {
    if (newData.planning) {
      newData.planning.forEach((act) => {
        const prevAct = prevPlanningRef.current.find(p => p.id === act.id);
        if (prevAct && prevAct.minutes_restantes > 0 && act.minutes_restantes === 0) {
          playElectronicBeep();
          setIsAlarmActive(true);
          setTimeout(() => setIsAlarmActive(false), 10000);
        }
      });
      prevPlanningRef.current = newData.planning;
    }
    setData(newData);
  };

  // --- FETCH MOUVEMENTS ---
  const fetchMouvements = async () => {
    try {
      const mouvRes = await api.get(`/mouvements-exterieurs/mouvements-actifs/`);
      setMouvementsRows(mouvRes.data);
    } catch (err) {
      setMouvementsRows(MOCK_MOUVEMENTS); // Fallback
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      if(openMouvements) fetchMouvements();
  }, [openMouvements]);


  // --- LOGIQUE MOUVEMENTS ---
  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });

  const handleSortie = async () => {
    if (!formMouv.matricule || !formMouv.num_document || formMouv.escorte.length < 5) {
      showToast("Dossier incomplet : Vérifiez le matricule, n° de document et l'escorte.", "error");
      return;
    }
    if (!formMouv.mandat_verifie || !formMouv.ordre_mission_verifie) {
      showToast("Sécurité : Toutes les pièces doivent être cochées.", "warning");
      return;
    }
    try {
      const payload = {
        ...formMouv,
        tribunal: formMouv.tribunal ? formMouv.tribunal.id : null,
        motif: `[${formMouv.type_document} N°${formMouv.num_document}] - ${formMouv.motif}`
      };
      await api.post(`/mouvements-exterieurs/enregistrer-sortie/`, payload);
      setFormMouv({ matricule: "", destination: "TRIBUNAL", tribunal: null, type_document: "MANDAT_EXTRACTION", num_document: "", motif: "", escorte: "Sgt. ", mandat_verifie: false, ordre_mission_verifie: false });
      showToast("Sortie enregistrée !");
      fetchMouvements();
    } catch (err) {
      showToast("Erreur API (ou Mode Secours actif).", "error");
    }
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(mouvementsRows.map(r => ({
      "Détenu": `${r.nom_detenu} ${r.postnom_detenu}`,
      "Destination": r.tribunal_details?.nom || r.destination,
      "Motif / Document": r.motif_details || r.motif,
      "Statut": r.statut
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Extractions");
    XLSX.writeFile(workbook, "Registre_Extractions.xlsx");
  };

  const CustomToolbar = () => (
    <GridToolbarContainer sx={{ p: 1, display: 'flex', justifyContent: 'space-between', bgcolor: alpha(DRC_BLUE, 0.05) }}>
      <GridToolbarQuickFilter placeholder="Rechercher un détenu..." sx={{ width: 300 }} />
      <Button size="small" startIcon={<DownloadOutlined />} onClick={exportExcel} sx={{ color: '#1D6F42', fontWeight: 'bold' }}>Excel</Button>
    </GridToolbarContainer>
  );

  const colonnesMouv = [
    { field: "nom_detenu", headerName: "DÉTENU", flex: 1.2, renderCell: (p) => (
      <Box display="flex" alignItems="center" gap={1.5}>
        <Avatar sx={{ width: 24, height: 24, bgcolor: DRC_BLUE, fontSize: "0.6rem", fontWeight: 900 }}>{p.row.nom_detenu?.[0]}</Avatar>
        <Typography variant="body2" fontWeight={800}>{p.row.nom_detenu} {p.row.postnom_detenu}</Typography>
      </Box>
    )},
    { field: "destination", headerName: "DESTINATION", flex: 1.5, renderCell: (p) => (
      <Stack direction="row" spacing={1} alignItems="center">
        {p.value?.includes("TRIBUNAL") ? <GavelIcon fontSize="small" sx={{color: DRC_BLUE}} /> : <LocalHospitalOutlined fontSize="small" sx={{color: DRC_RED}} />}
        <Typography variant="body2" fontWeight={700}>{p.row.tribunal_details ? p.row.tribunal_details.nom : p.value}</Typography>
      </Stack>
    )},
    { field: "motif", headerName: "ACTE JUSTIFICATIF", flex: 1.5, renderCell: (p) => (
        <Typography variant="caption" sx={{ fontStyle: 'italic', fontWeight: 600 }}>{p.value}</Typography>
    )},
    { field: "statut", headerName: "ÉTAT", width: 100, renderCell: ({ value }) => (
      <Chip label={value} size="small" sx={{ fontWeight: 900, borderRadius: "2px", fontSize: "0.6rem", bgcolor: value === "HORS MURS" ? DRC_RED : DRC_BLUE, color: "#fff" }} />
    )}
  ];

  if (loading) return (
    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh" gap={2}>
      <CircularProgress sx={{ color: DRC_BLUE }} thickness={6} size={60} />
      <Typography variant="button" fontWeight={900}>Initialisation du terminal d'Unité...</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 4, bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      
      {/* DRAPEAU RDC EN TÊTE */}
      <Box sx={{ display: 'flex', height: 4, mb: 1 }}>
        <Box sx={{ flex: 3, bgcolor: DRC_BLUE }} />
        <Box sx={{ flex: 0.5, bgcolor: DRC_YELLOW }} />
        <Box sx={{ flex: 0.5, bgcolor: DRC_RED }} />
      </Box>

      {/* BARRE D'ALERTE DYNAMIQUE */}
      <Box sx={{ 
        bgcolor: isAlarmActive ? DRC_RED : bc, color: "#fff", p: 1, mb: 4, textAlign: 'center',
        animation: isAlarmActive ? "flash-red 0.8s infinite" : "none", border: `1px solid ${bc}`
      }}>
        <Typography variant="caption" fontWeight={900} letterSpacing={2}>
          {isAlarmActive ? "⚠️ MOUVEMENT GÉNÉRAL : FIN D'ACTIVITÉ EN COURS" : `TERMINAL OPÉRATIONNEL • ${data?.server_time}`}
        </Typography>
      </Box>

      {/* HEADER INSTITUTIONNEL */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6} sx={{ borderBottom: `4px solid ${bc}`, pb: 2 }}>
        <Box display="flex" alignItems="center" gap={3}>
          <Box component="img" src={sceauRdc} alt="Sceau RDC" sx={{ height: 80, width: 'auto' }} />
          <Box>
            <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-2px", lineHeight: 1 }}>UNITÉ DE CONTRÔLE</Typography>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                <Box component="img" src={drapeauRdc} alt="Drapeau" sx={{ height: 14, width: 'auto' }} />
                <Typography variant="body2" fontWeight={800} sx={{ color: DRC_BLUE, textTransform: 'uppercase' }}>
                    Gestion des Flux & Vie Carcérale
                </Typography>
            </Stack>
          </Box>
        </Box>
        <Stack direction="row" spacing={2}>
            {/* BOUTON DÉCLENCHEUR DE LA MODALE */}
            <Button variant="outlined" startIcon={<DirectionsWalkOutlined />} onClick={() => setOpenMouvements(true)} sx={{ borderColor: DRC_RED, color: DRC_RED, fontWeight: 900, borderRadius: 0, borderWidth: 2, '&:hover': { borderWidth: 2, bgcolor: alpha(DRC_RED, 0.05) } }}>
                Mouvements Extérieurs
            </Button>
            <IconButton onClick={fetchDashboardData} sx={{ border: `2px solid ${bc}`, borderRadius: 0 }}><Refresh /></IconButton>
            <Button variant="contained" startIcon={<GavelOutlined />} sx={{ bgcolor: bc, color: inv, fontWeight: 900, borderRadius: 0 }}>Règlement</Button>
        </Stack>
      </Box>

      {/* DASHBOARD GRID */}
      <Grid container spacing={4}>
        {/* PLANNING - SECTION BLEUE */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, border: `2px solid ${bc}`, borderTop: `8px solid ${DRC_BLUE}`, borderRadius: 0, height: '100%' }}>
            <Typography variant="h6" fontWeight={900} mb={4} display="flex" alignItems="center" gap={1}>
              <ScheduleOutlined sx={{ color: DRC_BLUE }} /> EMPLOI DU TEMPS
            </Typography>
            {data?.planning.map((act) => (
              <Box key={act.id} sx={{ 
                p: 2, mb: 2, border: act.est_actuelle ? `2px solid ${DRC_BLUE}` : `1px solid ${alpha(bc, 0.1)}`,
                bgcolor: act.est_actuelle ? alpha(DRC_BLUE, 0.05) : "transparent"
              }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" fontWeight={900}>{act.heure_debut} - {act.heure_fin}</Typography>
                  {act.est_actuelle && <Chip label="ACTIF" size="small" sx={{ bgcolor: DRC_BLUE, color: "#fff", borderRadius: 0, fontWeight: 900 }} />}
                </Stack>
                <Typography variant="h6" fontWeight={900} sx={{ mt: 1 }}>{act.label.toUpperCase()}</Typography>
                {act.est_actuelle && (
                  <Stack direction="row" alignItems="center" spacing={1} mt={1} sx={{ color: act.minutes_restantes === 0 ? DRC_RED : DRC_BLUE }}>
                    <TimerOutlined sx={{ fontSize: 16 }} />
                    <Typography variant="caption" fontWeight={900}>
                       {act.minutes_restantes === 0 ? "TRANSITION IMMÉDIATE" : `IL RESTE ${act.minutes_restantes} MINUTES`}
                    </Typography>
                  </Stack>
                )}
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* RESTAURATION - SECTION JAUNE */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, border: `2px solid ${bc}`, borderTop: `8px solid ${DRC_YELLOW}`, borderRadius: 0, height: '100%' }}>
            <Typography variant="h6" fontWeight={900} mb={4} display="flex" alignItems="center" gap={1}>
              <RestaurantOutlined sx={{ color: DRC_YELLOW }} /> SERVICES DE BOUCHE
            </Typography>
            <Box sx={{ p: 3, border: `4px double ${bc}`, textAlign: 'center', mb: 4, bgcolor: alpha(DRC_YELLOW, 0.05) }}>
                <Typography variant="h2" fontWeight={900} sx={{ color: bc }}>{data?.cantine.servis}</Typography>
                <Typography variant="body2" fontWeight={800}>RATIONS DISTRIBUÉES SUR {data?.cantine.total}</Typography>
                <LinearProgress 
                  variant="determinate" value={data?.cantine.percent} 
                  sx={{ mt: 3, height: 12, bgcolor: alpha(bc, 0.1), "& .MuiLinearProgress-bar": { bgcolor: DRC_YELLOW } }} 
                />
            </Box>
            <Button 
                fullWidth variant="contained" onClick={() => setOpenScan(true)} startIcon={<Fingerprint />} 
                sx={{ height: 70, bgcolor: bc, color: inv, fontWeight: 900, borderRadius: 0, "&:hover": { bgcolor: alpha(bc, 0.8) } }}
            >
                DÉMARRER SCAN CANTINE
            </Button>
          </Paper>
        </Grid>

        {/* CORVÉES - SECTION ROUGE */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, border: `2px solid ${bc}`, borderTop: `8px solid ${DRC_RED}`, borderRadius: 0, height: '100%' }}>
            <Typography variant="h6" fontWeight={900} mb={4} display="flex" alignItems="center" gap={1}>
              <WorkOutline sx={{ color: DRC_RED }} /> ATELIERS ET TRAVAUX
            </Typography>
            {data?.corvees.map((corvee) => (
              <Box key={corvee.id} sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={900}>{corvee.label}</Typography>
                <Stack direction="row" alignItems="center" spacing={2} mt={1}>
                  <AvatarGroup max={4}>
                    {corvee.equipe.map((init, i) => (
                      <Avatar key={i} sx={{ width: 30, height: 30, fontSize: 10, bgcolor: DRC_BLUE, color: "#fff", border: `2px solid ${inv}` }}>{init}</Avatar>
                    ))}
                  </AvatarGroup>
                  <Chip label={corvee.statut} size="small" sx={{ fontWeight: 900, borderRadius: 0, border: `1px solid ${DRC_RED}`, color: DRC_RED }} />
                </Stack>
                <Divider sx={{ mt: 2 }} />
              </Box>
            ))}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 900, color: DRC_YELLOW }}>JUSTICE • PAIX • TRAVAIL</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* --- MODALE : MOUVEMENTS EXTÉRIEURS --- */}
      <Dialog 
        fullScreen 
        open={openMouvements} 
        onClose={() => setOpenMouvements(false)} 
        TransitionComponent={Transition}
        PaperProps={{ sx: { bgcolor: theme.palette.background.default } }}
      >
        <Box sx={{ bgcolor: bc, color: inv, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={900} display="flex" alignItems="center" gap={2}>
                <DirectionsWalkOutlined fontSize="large" sx={{ color: DRC_YELLOW }}/> 
                REGISTRE DES EXTRACTIONS & MOUVEMENTS
            </Typography>
            <IconButton onClick={() => setOpenMouvements(false)} sx={{ color: inv }}><CloseOutlined /></IconButton>
        </Box>
        
        <DialogContent sx={{ p: 4 }}>
            <Grid container spacing={4}>
                {/* FORMULAIRE EXTRACTION */}
                <Grid item xs={12} lg={4}>
                    <Paper elevation={0} sx={{ p: 3, border: `2px solid ${bc}`, borderTop: `8px solid ${DRC_RED}`, borderRadius: 0 }}>
                        <Typography variant="subtitle1" fontWeight={900} mb={3} color={DRC_RED} display="flex" alignItems="center" gap={1}>
                            <DescriptionOutlined /> AUTORISER UNE SORTIE
                        </Typography>
                        
                        <Stack spacing={2.5}>
                            <TextField fullWidth label="MATRICULE DÉTENU" variant="outlined" size="small" value={formMouv.matricule} onChange={(e) => setFormMouv({...formMouv, matricule: e.target.value})} />
                            <TextField select fullWidth label="TYPE DE DOCUMENT" variant="outlined" size="small" value={formMouv.type_document} onChange={(e) => setFormMouv({...formMouv, type_document: e.target.value})}>
                                {DOCUMENTS_JUSTIFICATIFS.map((doc) => (<MenuItem key={doc.id} value={doc.id}><Typography variant="body2" fontWeight={700}>{doc.label}</Typography></MenuItem>))}
                            </TextField>
                            <TextField fullWidth label="N° DU DOCUMENT" variant="outlined" size="small" value={formMouv.num_document} placeholder="Ex: RMP 1234/PR" onChange={(e) => setFormMouv({...formMouv, num_document: e.target.value})} />
                            
                            <Box display="flex" gap={1}>
                                <Button fullWidth variant={formMouv.destination === "TRIBUNAL" ? "contained" : "outlined"} onClick={() => setFormMouv({...formMouv, destination: "TRIBUNAL"})} startIcon={<GavelIcon />} sx={{fontWeight: 900, borderRadius: 0}}>TRIBUNAL</Button>
                                <Button fullWidth variant={formMouv.destination === "HÔPITAL" ? "contained" : "outlined"} color="error" onClick={() => setFormMouv({...formMouv, destination: "HÔPITAL"})} startIcon={<LocalHospitalOutlined />} sx={{fontWeight: 900, borderRadius: 0}}>HÔPITAL</Button>
                            </Box>

                            {formMouv.destination === "TRIBUNAL" && (
                                <Autocomplete options={tribunaux} getOptionLabel={(option) => option.nom} renderInput={(params) => <TextField {...params} label="JURIDICTION" variant="outlined" size="small" />} value={formMouv.tribunal} onChange={(e, newValue) => setFormMouv({...formMouv, tribunal: newValue})} />
                            )}

                            <TextField fullWidth label="CHEF D'ESCORTE" variant="outlined" size="small" value={formMouv.escorte} onChange={(e) => setFormMouv({...formMouv, escorte: e.target.value})} InputProps={{ startAdornment: <PolicyOutlined sx={{color: bc, mr:1}} /> }} />
                            
                            <FormGroup sx={{ bgcolor: alpha(DRC_BLUE, 0.05), p: 1.5, border: `1px dashed ${bc}` }}>
                                <FormControlLabel control={<Checkbox size="small" checked={formMouv.mandat_verifie} onChange={(e) => setFormMouv({...formMouv, mandat_verifie: e.target.checked})} />} label={<Typography variant="caption" fontWeight={700}>Document original vérifié</Typography>} />
                                <FormControlLabel control={<Checkbox size="small" checked={formMouv.ordre_mission_verifie} onChange={(e) => setFormMouv({...formMouv, ordre_mission_verifie: e.target.checked})} />} label={<Typography variant="caption" fontWeight={700}>Ordre de mission valide</Typography>} />
                            </FormGroup>

                            <Button fullWidth variant="contained" onClick={handleSortie} sx={{ bgcolor: DRC_RED, color: "#fff", py: 1.5, fontWeight: 900, borderRadius: 0, "&:hover": { bgcolor: "#a00d1a" } }}>
                                ENREGISTRER L'EXTRACTION
                            </Button>
                        </Stack>
                    </Paper>
                </Grid>

                {/* TABLEAU DATAGRID */}
                <Grid item xs={12} lg={8}>
                    <Paper elevation={0} sx={{ border: `2px solid ${bc}`, height: '100%', borderRadius: 0 }}>
                        <Box sx={{ p: 2, bgcolor: alpha(DRC_BLUE, 0.1), borderBottom: `2px solid ${bc}` }}>
                            <Typography variant="body2" fontWeight={900}>LISTE DES DÉTENUS HORS MURS</Typography>
                        </Box>
                        <Box sx={{ height: 600, width: '100%' }}>
                            <DataGrid
                                rows={mouvementsRows}
                                columns={colonnesMouv}
                                localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                                disableRowSelectionOnClick
                                slots={{ toolbar: CustomToolbar }}
                                slotProps={{ toolbar: { showQuickFilter: true } }}
                                sx={{ border: "none", borderRadius: 0, "& .MuiDataGrid-columnHeaders": { bgcolor: alpha(DRC_BLUE, 0.08), fontWeight: 'bold', borderRadius: 0 } }}
                            />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </DialogContent>
      </Dialog>

      {/* MODAL SCAN CANTINE */}
      <Modal open={openScan} onClose={() => setOpenScan(false)} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={openScan}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 350, bgcolor: 'background.paper', border: `4px solid ${DRC_BLUE}`, p: 4, textAlign: 'center' }}>
            <Fingerprint sx={{ fontSize: 80, mb: 2, color: DRC_BLUE, animation: 'pulse 2s infinite' }} />
            <Typography variant="h6" fontWeight={900}>AUTHENTIFICATION</Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>Validation de la ration par empreinte digitale</Typography>
            <Button onClick={() => setOpenScan(false)} fullWidth sx={{ bgcolor: bc, color: inv, fontWeight: 900, borderRadius: 0 }}>ANNULER</Button>
          </Box>
        </Fade>
      </Modal>

      {/* NOTIFICATIONS */}
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({...toast, open: false})} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setToast({...toast, open: false})} severity={toast.severity} sx={{ width: '100%', fontWeight: 'bold' }} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>

      <style>{`
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; color: ${DRC_YELLOW}; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes flash-red { 0% { background-color: ${bc}; } 50% { background-color: ${DRC_RED}; } 100% { background-color: ${bc}; } }
      `}</style>
    </Box>
  );
};

export default VieCarcerale;