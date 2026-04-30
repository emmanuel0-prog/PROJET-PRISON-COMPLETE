import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box, Typography, useTheme, alpha, Button, Grid, 
  Stack, Paper, Avatar, Chip, TextField, Autocomplete, 
  Checkbox, FormControlLabel, FormGroup, Divider, MenuItem,
  Snackbar, Alert, Card, CardContent, CircularProgress, IconButton
} from "@mui/material";
import { 
  DataGrid, frFR, GridToolbarContainer, GridToolbarQuickFilter 
} from "@mui/x-data-grid";
import {
  GavelOutlined, LocalHospitalOutlined, SearchOutlined,
  PrintOutlined, HistoryOutlined, DescriptionOutlined, 
  PolicyOutlined, DownloadOutlined, CheckCircleOutline,
  DirectionsWalkOutlined, VerifiedUserOutlined, WarningAmberOutlined
} from "@mui/icons-material";
import api from "../../../api"; // Ton instance Axios

// Imports pour l'exportation
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

// Assets Gouvernementaux
import sceauRdc from "../../../assets/gouvernement rdc.png";
import drapeauRdc from "../../../assets/rdc.png";

// --- CONFIGURATION VISUELLE RDC ---
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1021";


const DOCUMENTS_JUSTIFICATIFS = [
  { id: "MANDAT_AMENER", label: "Mandat d'Amener" },
  { id: "MANDAT_EXTRACTION", label: "Mandat d'Extraction" },
  { id: "REQUISITION_PARQUET", label: "Réquisition du Parquet" },
  { id: "ORDONNANCE_COMPARUTION", label: "Ordonnance de Comparution" },
  { id: "ORDRE_SOINS", label: "Réquisition Médicale / Soins" },
  { id: "ORDRE_TRANSFERT", label: "Ordre de Transfèrement" },
  { id: "AUTORISATION_EXCEPTIONNELLE", label: "Autorisation Exceptionnelle" },
];

const MouvementsExterieurs = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tribunaux, setTribunaux] = useState([]); 
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  // États pour la vérification High-Tech
  const [verifDetenu, setVerifDetenu] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [formData, setFormData] = useState({
    matricule: "", destination: "TRIBUNAL", tribunal: null,
    type_document: "MANDAT_EXTRACTION", num_document: "",
    motif: "", escorte: "Sgt. ", mandat_verifie: false, ordre_mission_verifie: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mouvRes, tribRes] = await Promise.all([
        api.get(`/mouvements-exterieurs/mouvements-actifs/`),
        api.get(`/tribunaux/`)
      ]);
      setRows(mouvRes.data);
      setTribunaux(tribRes.data);
    } catch (err) {
      showToast("Erreur de connexion au serveur central", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  // --- RECHERCHE AVANCÉE & VÉRIFICATION ---
  const handleVerifierIdentite = async () => {
    if (!formData.matricule.trim()) {
      showToast("Veuillez saisir un matricule à vérifier.", "warning");
      return;
    }
    
    setIsVerifying(true);
    setVerifDetenu(null);
    
    try {
      const res = await api.post(`/mouvements-exterieurs/verifier-detenu/`, { 
        matricule: formData.matricule.trim() 
      });
      setVerifDetenu(res.data);
      showToast("Identité confirmée au fichier central.", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Matricule introuvable ou non reconnu.", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  // --- ENREGISTREMENT DE LA SORTIE ---
  const handleSortie = async () => {
    if (!verifDetenu) {
      showToast("Sécurité : Vous devez d'abord vérifier et confirmer l'identité du détenu.", "error");
      return;
    }
    if (!formData.num_document || formData.escorte.length < 5) {
      showToast("Dossier incomplet : Vérifiez le n° de document et l'escorte.", "error");
      return;
    }
    if (!formData.mandat_verifie || !formData.ordre_mission_verifie) {
      showToast("Sécurité : Toutes les pièces doivent être cochées comme vérifiées physiquement.", "warning");
      return;
    }

    try {
      const payload = {
        ...formData,
        matricule: verifDetenu.matricule, // On force le matricule vérifié
        tribunal: formData.tribunal ? formData.tribunal.id : null,
        motif: `[${formData.type_document} N°${formData.num_document}] - ${formData.motif}`
      };

      await api.post(`/mouvements-exterieurs/enregistrer-sortie/`, payload);
      
      // Réinitialisation après succès
      setFormData({ 
        matricule: "", destination: "TRIBUNAL", tribunal: null, 
        type_document: "MANDAT_EXTRACTION", num_document: "",
        motif: "", escorte: "Sgt. ", mandat_verifie: false, ordre_mission_verifie: false 
      });
      setVerifDetenu(null);
      showToast("Extraction autorisée et enregistrée avec succès !", "success");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur lors de l'enregistrement", "error");
    }
  };

  const handleRetour = async (id) => {
    try {
      await api.post(`/mouvements-exterieurs/${id}/retour/`);
      showToast("Réintégration confirmée !", "success");
      fetchData();
    } catch (err) {
      showToast("Erreur lors de la réintégration.", "error");
    }
  };

  // --- FONCTIONS D'EXPORTATION ---
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Registre des Extractions - DGSP RDC", 14, 15);
    doc.autoTable({
      head: [['Détenu', 'Destination', 'Motif', 'Statut']],
      body: rows.map(r => [
        `${r.nom_detenu} ${r.postnom_detenu}`, 
        r.tribunal_details?.nom || r.destination, 
        r.motif_details || r.motif, 
        r.statut
      ]),
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: RDC_BLUE }
    });
    doc.save("Registre_Extractions.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(rows.map(r => ({
      "Détenu": `${r.nom_detenu} ${r.postnom_detenu}`,
      "Destination": r.tribunal_details?.nom || r.destination,
      "Motif / Document": r.motif_details || r.motif,
      "Chef Escorte": r.escorte,
      "Heure Sortie": new Date(r.heure_sortie).toLocaleString(),
      "Statut": r.statut
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Extractions");
    XLSX.writeFile(workbook, "Registre_Extractions.xlsx");
  };

  // --- TOOLBAR PERSONNALISÉE DATAGRID ---
  const CustomToolbar = () => (
    <GridToolbarContainer sx={{ p: 1, display: 'flex', justifyContent: 'space-between', bgcolor: alpha(RDC_BLUE, 0.05) }}>
      <GridToolbarQuickFilter placeholder="Rechercher un détenu, motif..." sx={{ width: 300 }} />
      <Stack direction="row" spacing={1}>
        <Button size="small" startIcon={<DownloadOutlined />} onClick={exportExcel} sx={{ color: '#1D6F42', fontWeight: 'bold' }}>Excel</Button>
        <Button size="small" startIcon={<PrintOutlined />} onClick={exportPDF} sx={{ color: RDC_RED, fontWeight: 'bold' }}>PDF</Button>
      </Stack>
    </GridToolbarContainer>
  );

  const columns = [
    { field: "nom_detenu", headerName: "DÉTENU", flex: 1.2, renderCell: (p) => (
      <Box display="flex" alignItems="center" gap={1.5}>
        <Avatar src={p.row.photo_detenu} sx={{ width: 30, height: 30, bgcolor: RDC_BLUE, borderRadius: 1, fontSize: "0.7rem", fontWeight: 900 }}>
          {!p.row.photo_detenu && p.row.nom_detenu?.[0]}
        </Avatar>
        <Typography variant="body2" fontWeight={500}>
          {p.row.nom_detenu} {p.row.postnom_detenu} 
        </Typography>
      </Box>
    )},
    { field: "destination", headerName: "DESTINATION", flex: 1.5, renderCell: (p) => (
      <Stack direction="row" spacing={1} alignItems="center">
        {p.value?.includes("TRIBUNAL") ? <GavelOutlined fontSize="small" sx={{color: RDC_BLUE}} /> : <LocalHospitalOutlined fontSize="small" sx={{color: RDC_RED}} />}
        <Typography variant="body2" fontWeight={500}>
            {p.row.tribunal_details ? p.row.tribunal_details.nom : p.value}
        </Typography>
      </Stack>
    )},
    { field: "motif_details", headerName: "ACTE JUSTIFICATIF", flex: 1.5, renderCell: (p) => (
        <Typography variant="caption" sx={{ fontStyle: 'italic', fontWeight: 600 }}>{p.value || p.row.motif}</Typography>
    )},
    { field: "statut", headerName: "ÉTAT", width: 110, renderCell: ({ value }) => (
      <Chip label={value} size="small" sx={{ fontWeight: 900, borderRadius: "4px", fontSize: "0.65rem", bgcolor: value === "HORS MURS" ? RDC_RED : RDC_BLUE, color: "#fff" }} />
    )},
    { field: "actions", headerName: "RÉINTÉGRATION", width: 130, renderCell: (p) => (
      <Button variant="contained" size="small" onClick={() => handleRetour(p.row.id)} startIcon={<CheckCircleOutline />} sx={{ bgcolor: RDC_YELLOW, color: "#000", borderRadius: 1, fontSize: "0.6rem", fontWeight: 900, boxShadow: 'none' }}>
        RETOUR
      </Button>
    )}
  ];

  return (
    <Box sx={{ p: 4, bgcolor: isDark ? "#0a1929" : "#f4f7f9", minHeight: "100vh" }}>
      
      {/* HEADER OFFICIEL RDC */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={4} sx={{ borderBottom: `4px solid ${RDC_BLUE}`, pb: 2 }}>
        <Box display="flex" alignItems="center" gap={3}>
            <Box sx={{ width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <img src={sceauRdc} alt="Sceau RDC" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>
            <Box>
                <Typography variant="h4" fontWeight={900} sx={{ color: isDark ? "#fff" : RDC_BLUE, textTransform: 'uppercase' }}>
                  Contrôle des Extractions
                </Typography>
                <Typography variant="caption" fontWeight={800} sx={{ color: RDC_RED, letterSpacing: 1.5 }}>
                  DIRECTION GÉNÉRALE DE LA SÉCURITÉ PÉNITENTIAIRE
                </Typography>
            </Box>
        </Box>
        <Button variant="outlined" onClick={fetchData} startIcon={<HistoryOutlined />} sx={{ borderColor: RDC_BLUE, color: RDC_BLUE, fontWeight: 900 }}>
          Actualiser le Fichier
        </Button>
      </Box>

      {/* STATISTIQUES */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: RDC_BLUE, color: '#fff', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
              <DirectionsWalkOutlined sx={{ fontSize: 150 }} />
            </Box>
            <CardContent>
              <Typography variant="overline" fontWeight={700}>TOTAL DÉTENUS HORS MURS</Typography>
              <Typography variant="h3" fontWeight={900}>{rows.filter(r => r.statut === "HORS MURS").length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: RDC_RED, color: '#fff', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
             <Box sx={{ position: 'absolute', right: -10, top: -10, opacity: 0.15 }}>
              <LocalHospitalOutlined sx={{ fontSize: 130 }} />
            </Box>
            <CardContent>
              <Typography variant="overline" fontWeight={700}>EXTRACTIONS MÉDICALES ACTIVES</Typography>
              <Typography variant="h3" fontWeight={900}>{rows.filter(r => r.destination === "HÔPITAL" && r.statut === "HORS MURS").length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* DOSSIER DE TRANSFERT NUMÉRIQUE - PANNEAU DE GAUCHE */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={4} sx={{ p: 3, borderTop: `6px solid ${RDC_BLUE}`, borderRadius: 2, position: 'relative' }}>
            
            <Typography variant="subtitle1" fontWeight={900} mb={3} color={RDC_BLUE} display="flex" alignItems="center" gap={1}>
                <DescriptionOutlined /> AUTORISATION DE SORTIE
            </Typography>
            
            <Stack spacing={2.5}>
              {/* RECHERCHE HIGH-TECH */}
              <Box display="flex" gap={1}>
                <TextField 
                  fullWidth label="MATRICULE DÉTENU" variant="outlined" size="small"
                  value={formData.matricule}
                  onChange={(e) => setFormData({...formData, matricule: e.target.value})}
                  onKeyDown={(e) => { if(e.key === 'Enter') handleVerifierIdentite(); }}
                  disabled={isVerifying}
                  InputProps={{ 
                    sx: { fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.1rem' } 
                  }} 
                />
                <Button 
                  variant="contained" 
                  onClick={handleVerifierIdentite}
                  disabled={isVerifying || !formData.matricule}
                  sx={{ bgcolor: RDC_YELLOW, color: "#000", minWidth: '50px', '&:hover': {bgcolor: '#d4b60b'} }}
                >
                  {isVerifying ? <CircularProgress size={24} color="inherit" /> : <SearchOutlined />}
                </Button>
              </Box>

              {/* CARTE D'IDENTITÉ NUMÉRIQUE DU DÉTENU VÉRIFIÉ */}
              {verifDetenu && (
                <Box sx={{ 
                  p: 2, border: `2px solid ${RDC_BLUE}`, borderRadius: 2, 
                  bgcolor: alpha(RDC_BLUE, 0.03), position: 'relative',
                  backgroundImage: `url(${drapeauRdc})`, backgroundSize: '20%', 
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'bottom right',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.02)'
                }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar 
                      src={verifDetenu.photo} 
                      variant="rounded" 
                      sx={{ width: 80, height: 80, border: `2px solid ${RDC_BLUE}`, boxShadow: theme.shadows[3] }} 
                    >
                      {!verifDetenu.photo && <WarningAmberOutlined sx={{fontSize: 40, color: '#ccc'}}/>}
                    </Avatar>
                    <Box>
                      <Typography variant="caption" sx={{ color: RDC_BLUE, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <VerifiedUserOutlined fontSize="small"/> IDENTITÉ CONFIRMÉE
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, textTransform: "uppercase", mt: 0.5 }}>
                        {verifDetenu.nom} {verifDetenu.postnom} {verifDetenu.prenom}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: isDark ? '#333' : '#e0e0e0', color: isDark ? '#fff' : '#000', px: 1, py: 0.2, mt: 0.5, display: 'inline-block', fontWeight: 'bold', borderRadius: 1 }}>
                        ID: {verifDetenu.matricule}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}
              
              <Divider sx={{ my: 1 }}><Chip label="ACTE AUTORISANT LA SORTIE" size="small" sx={{fontSize: '0.6rem', fontWeight: 900}}/></Divider>

              <TextField
                select fullWidth label="TYPE DE DOCUMENT" variant="outlined" size="small"
                value={formData.type_document}
                onChange={(e) => setFormData({...formData, type_document: e.target.value})}
              >
                {DOCUMENTS_JUSTIFICATIFS.map((doc) => (
                  <MenuItem key={doc.id} value={doc.id}>
                    <Typography variant="body2" fontWeight={700}>{doc.label}</Typography>
                  </MenuItem>
                ))}
              </TextField>

              <TextField 
                fullWidth label="N° DE RÉFÉRENCE DU DOCUMENT" variant="outlined" size="small"
                value={formData.num_document} placeholder="Ex: RMP 1234/PR/2026"
                onChange={(e) => setFormData({...formData, num_document: e.target.value})}
              />

              <Box display="flex" gap={1}>
                <Button fullWidth variant={formData.destination === "TRIBUNAL" ? "contained" : "outlined"} onClick={() => setFormData({...formData, destination: "TRIBUNAL", tribunal: null})} startIcon={<GavelOutlined />} sx={{fontSize: '0.65rem', fontWeight: 900}}>TRIBUNAL</Button>
                <Button fullWidth variant={formData.destination === "HÔPITAL" ? "contained" : "outlined"} color="error" onClick={() => setFormData({...formData, destination: "HÔPITAL", tribunal: null})} startIcon={<LocalHospitalOutlined />} sx={{fontSize: '0.65rem', fontWeight: 900}}>HÔPITAL</Button>
              </Box>

              {formData.destination === "TRIBUNAL" && (
                <Autocomplete
                    options={tribunaux}
                    getOptionLabel={(option) => option.nom}
                    renderInput={(params) => <TextField {...params} label="JURIDICTION" variant="outlined" size="small" />}
                    value={formData.tribunal}
                    onChange={(e, newValue) => setFormData({...formData, tribunal: newValue})}
                />
              )}

              <TextField 
                fullWidth label="MOTIF / OBSERVATION" variant="outlined" multiline rows={2} size="small"
                value={formData.motif}
                onChange={(e) => setFormData({...formData, motif: e.target.value})}
              />

              <Divider sx={{ my: 1 }}><Chip label="PROTOCOLE SÉCURITÉ" size="small" sx={{fontSize: '0.6rem', fontWeight: 900}}/></Divider>

              <TextField 
                fullWidth label="CHEF D'ESCORTE" variant="outlined" size="small"
                value={formData.escorte}
                onChange={(e) => setFormData({...formData, escorte: e.target.value})}
                InputProps={{ startAdornment: <PolicyOutlined sx={{color: RDC_BLUE, mr:1}} /> }}
              />

              <FormGroup sx={{ bgcolor: alpha(RDC_BLUE, 0.05), p: 1.5, borderRadius: 2, border: `1px dashed ${RDC_BLUE}` }}>
                <FormControlLabel control={<Checkbox size="small" checked={formData.mandat_verifie} onChange={(e) => setFormData({...formData, mandat_verifie: e.target.checked})} />} 
                    label={<Typography variant="caption" fontWeight={700}>Document original vérifié physiquement</Typography>} />
                <FormControlLabel control={<Checkbox size="small" checked={formData.ordre_mission_verifie} onChange={(e) => setFormData({...formData, ordre_mission_verifie: e.target.checked})} />} 
                    label={<Typography variant="caption" fontWeight={700}>Ordre de mission du chef d'escorte valide</Typography>} />
              </FormGroup>

              <Button 
                fullWidth variant="contained" onClick={handleSortie} startIcon={<DirectionsWalkOutlined />}
                disabled={!verifDetenu} // Sécurité : On bloque le bouton si l'identité n'est pas vérifiée
                sx={{ 
                  bgcolor: RDC_RED, color: "#fff", py: 1.5, fontWeight: 900, borderRadius: 2, 
                  "&:hover": { bgcolor: "#a00d1a" },
                  "&.Mui-disabled": { bgcolor: alpha(RDC_RED, 0.3), color: "#fff" }
                }}
              >
                AUTORISER L'EXTRACTION
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* TABLEAU DES MOUVEMENTS - PANNEAU DE DROITE */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={4} sx={{ borderRadius: 2, overflow: "hidden", height: '100%', border: `1px solid ${alpha(RDC_BLUE, 0.2)}` }}>
            <Box sx={{ height: 800, width: '100%' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                    disableRowSelectionOnClick
                    slots={{ toolbar: CustomToolbar }}
                    slotProps={{
                        toolbar: { showQuickFilter: true },
                    }}
                    sx={{ 
                        border: "none", 
                        "& .MuiDataGrid-columnHeaders": { bgcolor: alpha(RDC_BLUE, 0.08), fontWeight: 'bold' },
                        "& .MuiDataGrid-row:hover": { bgcolor: alpha(RDC_YELLOW, 0.1) }
                    }}
                />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* NOTIFICATIONS SYSTÈME */}
      <Snackbar open={toast.open} autoHideDuration={5000} onClose={() => setToast({...toast, open: false})} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setToast({...toast, open: false})} severity={toast.severity} sx={{ width: '100%', fontWeight: 'bold', boxShadow: theme.shadows[4] }} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default MouvementsExterieurs;