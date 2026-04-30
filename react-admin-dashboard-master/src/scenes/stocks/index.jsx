import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Box, Typography, alpha, Button, Grid, Stack, Paper,
  IconButton, Chip, Modal, Fade,
  TextField, MenuItem, Snackbar, Alert, Tabs, Tab, Tooltip, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment
} from "@mui/material";
import {
  Inventory, History, Add, Edit, Delete,
  RestoreFromTrash, Close, SwapHoriz,
  WarningAmber, PrecisionManufacturing,
  AccountBalance, LocalShipping, QueryStats,
  LightMode, DarkMode
} from "@mui/icons-material";
import { DataGrid, frFR, GridToolbarQuickFilter } from "@mui/x-data-grid";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// ASSETS NATIONAUX (À conserver dans votre projet)
import sceauRdc from "../../assets/gouvernement rdc.png";
import drapeauRdc from "../../assets/rdc.png";

// --- CONFIGURATION SYSTÈME (Couleurs Institutionnelles) ---
const DRC_BLUE = "#007FFF";
const DRC_YELLOW = "#F7D618";
const DRC_RED = "#CE1021";

const GestionStocks = () => {
  // --- GESTION DU THÈME (DARK / LIGHT) ---
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Variables dynamiques selon le mode
  const BG_COLOR = isDarkMode ? "#05070A" : "#F0F4F8";
  const PAPER_BG = isDarkMode ? "#0D1117" : "#FFFFFF";
  const TEXT_PRIMARY = isDarkMode ? "#FFFFFF" : "#1A2027";
  const BORDER_COLOR = isDarkMode ? alpha("#fff", 0.1) : alpha("#000", 0.1);
  const ROW_HOVER = isDarkMode ? alpha("#fff", 0.02) : alpha("#000", 0.03);

  // États des données
  const [tab, setTab] = useState(0);
  const [articles, setArticles] = useState([]);
  const [trash, setTrash] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState({ type: null, data: null });
  const [toast, setToast] = useState({ open: false, msg: "", sev: "success" });

  // --- SYNCHRONISATION SERVEUR ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resArt, resTrash] = await Promise.all([
        axios.get("http://localhost:8000/api/stocks/articles/"),
        axios.get("http://localhost:8000/api/stocks/corbeille/")
      ]);
      setArticles(resArt.data);
      setTrash(resTrash.data);
    } catch (err) {
      showToast("Interruption de la liaison avec le serveur central", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const showToast = (msg, sev = "success") => setToast({ open: true, msg, sev });

  // --- PROTOCOLES CRUD ---
  const handleSaveArticle = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    // Formatage des données pour l'API
    data.seuil_alerte = parseInt(data.seuil_alerte, 10);
    data.valeur_unitaire = parseFloat(data.valeur_unitaire);
    
    // La quantité initiale n'est envoyée qu'à la création
    if (!openModal.data?.id) {
        data.quantite = parseInt(data.quantite, 10);
    }

    try {
      if (openModal.data?.id) {
        // Mode ÉDITION
        await axios.put(`http://localhost:8000/api/stocks/articles/${openModal.data.id}/`, data);
        showToast("Fiche ressource mise à jour avec succès");
      } else {
        // Mode CRÉATION
        await axios.post("http://localhost:8000/api/stocks/articles/", data);
        showToast("Nouvelle ressource enregistrée dans le patrimoine national");
      }
      setOpenModal({ type: null, data: null });
      loadData();
    } catch (err) {
      console.error(err);
      showToast("Violation de l'intégrité des données (Vérifiez les champs)", "error");
    }
  };


const exportPDF = () => {
  const doc = new jsPDF();

  // TITRE
  doc.setFontSize(18);
  doc.text("RÉPUBLIQUE DÉMOCRATIQUE DU CONGO", 105, 15, null, null, "center");

  doc.setFontSize(12);
  doc.text("MINISTÈRE DE LA JUSTICE", 105, 22, null, null, "center");

  doc.setFontSize(14);
  doc.text("RAPPORT DES STOCKS", 105, 30, null, null, "center");

  // DATE
  const date = new Date().toLocaleString();
  doc.setFontSize(10);
  doc.text(`Date : ${date}`, 14, 40);

  // TABLEAU
  const tableData = articles.map((a) => [
    a.id,
    a.nom,
    a.categorie,
    `${a.quantite} ${a.unite}`,
    a.seuil_alerte,
    `${a.valeur_unitaire} $`,
    a.en_rupture ? "OUI" : "NON"
  ]);

  autoTable(doc, {
    startY: 45,
    head: [[
      "ID",
      "Article",
      "Catégorie",
      "Quantité",
      "Seuil",
      "Valeur ($)",
      "Rupture"
    ]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 9,
      halign: "center"
    },
    headStyles: {
      fillColor: [0, 127, 255] // Bleu RDC
    }
  });

  // TOTAL
  const total = articles.reduce(
    (acc, a) => acc + a.quantite * parseFloat(a.valeur_unitaire),
    0
  );

  doc.text(`Valeur totale du stock : ${total.toLocaleString()} $`, 14, doc.lastAutoTable.finalY + 10);

  // DOWNLOAD
  doc.save("rapport_stocks.pdf");
};

  const handleAction = async (action, id, payload = {}) => {
    try {
      if (action === "DELETE") await axios.delete(`http://localhost:8000/api/stocks/articles/${id}/`);
      if (action === "RESTORE") await axios.post(`http://localhost:8000/api/stocks/corbeille/${id}/`);
      if (action === "PERMANENT_DELETE") await axios.delete(`http://localhost:8000/api/stocks/corbeille/${id}/`);
      if (action === "MOVEMENT") await axios.post("http://localhost:8000/api/stocks/mouvement/", payload);
      
      showToast("Autorisation accordée : Opération terminée avec succès");
      loadData();
      setOpenModal({ type: null, data: null });
    } catch (err) {
      showToast(err.response?.data?.error || "Échec critique du protocole", "error");
    }
  };

  // --- ÉLÉMENTS D'INTERFACE ---
  const StatCard = ({ title, val, color, icon: Icon }) => (
    <Paper sx={{ 
      p: 3, borderRadius: 0, bgcolor: PAPER_BG, border: `1px solid ${alpha(color, 0.3)}`,
      position: 'relative', overflow: 'hidden', boxShadow: isDarkMode ? 'none' : '0 4px 12px rgba(0,0,0,0.05)',
      transition: '0.3s', '&:hover': { border: `1px solid ${color}`, transform: 'translateY(-2px)' }
    }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ p: 1.5, bgcolor: alpha(color, 0.1), color }}>
          <Icon fontSize="large" />
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: isDarkMode ? alpha("#fff", 0.5) : alpha("#000", 0.6), fontWeight: 900 }}>{title.toUpperCase()}</Typography>
          <Typography variant="h4" sx={{ color: TEXT_PRIMARY, fontWeight: 900, fontFamily: 'Orbitron, sans-serif' }}>{val}</Typography>
        </Box>
      </Stack>
      <Box sx={{ mt: 2, height: 2, bgcolor: alpha(color, 0.1), width: '100%', position: 'absolute', bottom: 0, left: 0 }}>
          <Box sx={{ height: '100%', width: '40%', bgcolor: color, boxShadow: `0 0 10px ${color}` }} />
      </Box>
    </Paper>
  );

  const columns = [
    { field: "nom", headerName: "IDENTIFICATION", flex: 1, renderCell: (p) => (
      <Box sx={{ py: 1 }}>
        <Typography sx={{ fontWeight: 800, color: DRC_BLUE, letterSpacing: 0.5 }}>{p.value.toUpperCase()}</Typography>
        <Typography variant="caption" sx={{ color: isDarkMode ? alpha("#fff", 0.4) : alpha("#000", 0.5) }}>RÉF: RDC-STK-{p.row.id.toString().padStart(5, '0')}</Typography>
      </Box>
    )},
    { field: "categorie", headerName: "DOMAINE MINISTÉRIEL", width: 200, renderCell: (p) => (
      <Chip label={p.value} size="small" sx={{ borderRadius: 0, fontWeight: 900, border: `1px solid ${alpha(DRC_YELLOW, 0.5)}`, bgcolor: alpha(DRC_YELLOW, 0.1), color: isDarkMode ? DRC_YELLOW : '#B39D00' }} />
    )},
    { field: "quantite", headerName: "RÉSERVE ACTUELLE", width: 180, renderCell: (p) => (
      <Box sx={{ 
        width: '100%', p: 1, border: `1px solid ${p.row.en_rupture ? DRC_RED : alpha(DRC_BLUE, 0.4)}`,
        bgcolor: p.row.en_rupture ? alpha(DRC_RED, 0.1) : alpha(DRC_BLUE, 0.05),
        textAlign: 'center', animation: p.row.en_rupture ? 'pulse 1.5s infinite' : 'none'
      }}>
        <Typography sx={{ fontWeight: 900, color: p.row.en_rupture ? DRC_RED : TEXT_PRIMARY }}>
          {p.value} {p.row.unite.toUpperCase()}
        </Typography>
      </Box>
    )},
    { field: "actions", headerName: "CENTRE DE COMMANDE", width: 220, sortable: false, renderCell: (p) => (
      <Stack direction="row" spacing={1}>
        <Tooltip title="Mouvement de Flux"><IconButton size="small" onClick={() => setOpenModal({ type: 'MVT', data: p.row })} sx={{ color: isDarkMode ? DRC_YELLOW : '#B39D00', border: `1px solid ${alpha(DRC_YELLOW, 0.2)}` }}><SwapHoriz /></IconButton></Tooltip>
        <Tooltip title="Éditer Dossier"><IconButton size="small" onClick={() => setOpenModal({ type: 'EDIT', data: p.row })} sx={{ color: isDarkMode ? "#fff" : "#000", border: `1px solid ${BORDER_COLOR}` }}><Edit /></IconButton></Tooltip>
        <Tooltip title="Audit Traçabilité"><IconButton size="small" onClick={() => setOpenModal({ type: 'HISTORY', data: p.row })} sx={{ color: DRC_BLUE, border: `1px solid ${alpha(DRC_BLUE, 0.2)}` }}><History /></IconButton></Tooltip>
        <Tooltip title="Droit d'Archive"><IconButton size="small" onClick={() => handleAction("DELETE", p.row.id)} sx={{ color: DRC_RED, border: `1px solid ${alpha(DRC_RED, 0.2)}` }}><Delete /></IconButton></Tooltip>
      </Stack>
    )}
  ];

  return (
    <Box sx={{ p: 4, minHeight: "100vh", bgcolor: BG_COLOR, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", transition: 'background-color 0.3s' }}>
      
      {/* HEADER DE TYPE RÉGALIEN */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 4, borderBottom: `2px solid ${DRC_BLUE}`, pb: 2 }}>
        <Stack direction="row" spacing={3} alignItems="center">
          {/* Remplacez src={sceauRdc} par votre chemin valide */}
          <img src={sceauRdc} alt="Sceau" style={{ height: 80, filter: "drop-shadow(0 0 10px rgba(0,127,255,0.3))" }} />
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: -1, lineHeight: 1, color: TEXT_PRIMARY }}>GESTION DES STOCKS</Typography>
            <Typography variant="h6" sx={{ color: isDarkMode ? DRC_YELLOW : '#B39D00', fontWeight: 700, letterSpacing: 2, fontSize: '0.9rem', mt: 0.5 }}>MINISTÈRE DE LA JUSTICE • LOGISTIQUE CENTRALE</Typography>
          </Box>
        </Stack>
        
        <Stack direction="row" spacing={3} alignItems="center">
            <IconButton onClick={() => setIsDarkMode(!isDarkMode)} sx={{ color: TEXT_PRIMARY, border: `1px solid ${BORDER_COLOR}` }}>
                {isDarkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
            <Box sx={{ textAlign: 'center', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="caption" sx={{ color: "gray", display: 'block', fontWeight: 'bold' }}>AUTORITÉ LOCALE</Typography>
                <img src={drapeauRdc} alt="Drapeau" style={{ height: 35, border: `1px solid ${BORDER_COLOR}` }} />
            </Box>
            <Button 
                variant="contained" startIcon={<Add />} 
                onClick={() => setOpenModal({ type: 'EDIT', data: {} })}
                sx={{ bgcolor: DRC_BLUE, color: "#fff", fontWeight: 900, borderRadius: 0, px: 4, py: 1.5, '&:hover': { bgcolor: isDarkMode ? DRC_YELLOW : '#005bb5', color: isDarkMode ? "#000" : '#fff' } }}
            >
                NOUVEL ENREGISTREMENT
            </Button>
            <Button
  variant="outlined"
  onClick={exportPDF}
  sx={{
    color: "#F7D618",
    borderColor: "#F7D618",
    fontWeight: 900,
    borderRadius: 0,
    px: 3,
    '&:hover': {
      bgcolor: "#F7D618",
      color: "#000"
    }
  }}
>
  EXPORT PDF
</Button>
        </Stack>
      </Stack>

      {/* DASHBOARD ANALYTIQUE */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Ressources Actives" val={articles.length} color={DRC_BLUE} icon={Inventory} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Alertes Rupture" val={articles.filter(a => a.en_rupture).length} color={DRC_RED} icon={WarningAmber} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Évaluation Patrimoine" val={`${articles.reduce((acc, a) => acc + (a.quantite * parseFloat(a.valeur_unitaire || 0)), 0).toLocaleString()} $`} color={DRC_YELLOW} icon={QueryStats} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Capacité Logistique" val="94%" color={isDarkMode ? "#00ff00" : "#00aa00"} icon={LocalShipping} /></Grid>
      </Grid>

      {/* ZONE DE TRAVAIL SÉCURISÉE */}
      <Paper sx={{ borderRadius: 0, bgcolor: PAPER_BG, border: `1px solid ${BORDER_COLOR}`, p: 1, boxShadow: isDarkMode ? 'none' : '0 4px 15px rgba(0,0,0,0.05)' }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2, borderBottom: `1px solid ${BORDER_COLOR}` }}>
          <Tab label="INVENTAIRE NATIONAL" sx={{ color: "gray", "&.Mui-selected": { color: DRC_BLUE, fontWeight: 900 } }} />
          <Tab label="CORBEILLE D'ARCHIVAGE" sx={{ color: "gray", "&.Mui-selected": { color: DRC_RED, fontWeight: 900 } }} />
        </Tabs>

        <Box sx={{ height: 650, width: '100%' }}>
          <DataGrid 
            rows={tab === 0 ? articles : trash} 
            columns={tab === 0 ? columns : columns.map(c => c.field === 'actions' ? {
                ...c, renderCell: (p) => (
                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" size="small" startIcon={<RestoreFromTrash />} onClick={() => handleAction("RESTORE", p.row.id)} sx={{ color: isDarkMode ? "#00ff00" : "#00aa00", borderColor: isDarkMode ? "#00ff00" : "#00aa00" }}>RESTAURER</Button>
                        <IconButton onClick={() => handleAction("PERMANENT_DELETE", p.row.id)} sx={{ color: DRC_RED }}><Close /></IconButton>
                    </Stack>
                )
            } : c)}
            loading={loading}
            slots={{ toolbar: GridToolbarQuickFilter }}
            sx={{
                border: 0, color: TEXT_PRIMARY,
                "& .MuiDataGrid-cell": { borderBottom: `1px solid ${BORDER_COLOR}` },
                "& .MuiDataGrid-columnHeaders": { bgcolor: ROW_HOVER, borderRadius: 0, borderBottom: `2px solid ${BORDER_COLOR}` },
                "& .MuiDataGrid-toolbarContainer": { p: 2, borderBottom: `1px solid ${BORDER_COLOR}` },
                "& .MuiDataGrid-row:hover": { bgcolor: ROW_HOVER }
            }}
            localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          />
        </Box>
      </Paper>

      {/* MODALE 1 : FORMULAIRE D'IDENTIFICATION (AJOUT/EDIT) */}
      <Modal open={openModal.type === 'EDIT'} onClose={() => setOpenModal({ type: null, data: null })} closeAfterTransition>
        <Fade in={openModal.type === 'EDIT'}>
          <Box sx={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
            width: { xs: '90%', sm: 550 }, bgcolor: PAPER_BG, p: 4, border: `2px solid ${DRC_BLUE}`, 
            boxShadow: `0 0 30px ${alpha(DRC_BLUE, isDarkMode ? 0.3 : 0.1)}`
          }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                <AccountBalance sx={{ color: DRC_BLUE, fontSize: 30 }} />
                <Typography variant="h5" sx={{ fontWeight: 900, color: DRC_BLUE, m: 0 }}>FICHE D'IMMOBILISATION STOCK</Typography>
            </Stack>
            
            <form onSubmit={handleSaveArticle}>
              <Stack spacing={3}>
                <TextField 
                    name="nom" label="DÉSIGNATION DE LA RESSOURCE" variant="filled" fullWidth required
                    defaultValue={openModal.data?.nom} 
                    InputProps={{ style: { color: TEXT_PRIMARY, fontWeight: 800, backgroundColor: ROW_HOVER }, startAdornment: <InputAdornment position="start"><PrecisionManufacturing sx={{color:DRC_BLUE}} /></InputAdornment> }}
                    InputLabelProps={{ style: { color: 'gray' } }}
                />

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={7}>
                        <TextField 
                            name="categorie" select label="DOMAINE MINISTÉRIEL" variant="filled" fullWidth defaultValue={openModal.data?.categorie || 'Alimentation'}
                            InputProps={{ style: { color: TEXT_PRIMARY, backgroundColor: ROW_HOVER } }} InputLabelProps={{ style: { color: 'gray' } }}
                        >
                            <MenuItem value="Alimentation">Alimentation & Vivres</MenuItem>
                            <MenuItem value="Médical">Médical & Pharmacie</MenuItem>
                            <MenuItem value="Équipement">Équipements & Uniformes</MenuItem>
                            <MenuItem value="Entretien">Entretien & Hygiène</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={5}>
                        <TextField 
                            name="unite" label="UNITÉ DE MESURE" variant="filled" fullWidth placeholder="Ex: Sacs, kg, Boîtes..." required
                            defaultValue={openModal.data?.unite} 
                            InputProps={{ style: { color: TEXT_PRIMARY, backgroundColor: ROW_HOVER } }} InputLabelProps={{ style: { color: 'gray' } }}
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        {/* La quantité initiale n'est modifiable qu'à la création */}
                        <TextField 
                            name="quantite" label="QUANTITÉ INITIALE" type="number" variant="filled" fullWidth required
                            defaultValue={openModal.data?.quantite || 0}
                            disabled={!!openModal.data?.id} // Désactivé si édition (Doit passer par un Mouvement)
                            InputProps={{ style: { color: TEXT_PRIMARY, fontWeight: 900, backgroundColor: ROW_HOVER } }} InputLabelProps={{ style: { color: 'gray' } }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField 
                            name="seuil_alerte" label="SEUIL CRITIQUE" type="number" variant="filled" fullWidth required
                            defaultValue={openModal.data?.seuil_alerte || 10} 
                            InputProps={{ style: { color: DRC_RED, fontWeight: 900, backgroundColor: ROW_HOVER } }} InputLabelProps={{ style: { color: 'gray' } }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField 
                            name="valeur_unitaire" label="VALEUR UNITAIRE ($)" type="number" variant="filled" fullWidth required
                            inputProps={{ step: "0.01" }}
                            defaultValue={openModal.data?.valeur_unitaire || 0} 
                            InputProps={{ style: { color: isDarkMode ? DRC_YELLOW : '#A68A00', fontWeight: 900, backgroundColor: ROW_HOVER } }} InputLabelProps={{ style: { color: 'gray' } }}
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ bgcolor: BORDER_COLOR, my: 1 }} />

                <Stack direction="row" spacing={2}>
                    <Button fullWidth onClick={() => setOpenModal({ type: null, data: null })} sx={{ color: 'gray', fontWeight: 900, border: `1px solid ${BORDER_COLOR}` }}>ANNULER</Button>
                    <Button type="submit" variant="contained" fullWidth sx={{ bgcolor: DRC_BLUE, color: "#fff", fontWeight: 900, borderRadius: 0, '&:hover': {bgcolor: '#005bb5'} }}>
                        {openModal.data?.id ? "ACTUALISER LE DOSSIER" : "VALIDER L'INSCRIPTION"}
                    </Button>
                </Stack>
              </Stack>
            </form>
          </Box>
        </Fade>
      </Modal>

      {/* MODALE 2 : MOUVEMENTS DE FLUX (ENTRÉE/SORTIE) */}
      <Modal open={openModal.type === 'MVT'} onClose={() => setOpenModal({ type: null, data: null })}>
        <Fade in={openModal.type === 'MVT'}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: {xs:'90%', sm: 450}, bgcolor: PAPER_BG, p: 4, borderTop: `10px solid ${DRC_YELLOW}`, border: `1px solid ${BORDER_COLOR}`, boxShadow: 24 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: isDarkMode ? DRC_YELLOW : '#A68A00' }}>AUTORISATION DE FLUX LOGISTIQUE</Typography>
            <Typography variant="caption" sx={{ color: "gray", display: 'block', mb: 3 }}>ARTICLE CIBLE : {openModal.data?.nom?.toUpperCase()}</Typography>
            
            <form onSubmit={(e) => {
                e.preventDefault();
                const d = new FormData(e.target);
                handleAction("MOVEMENT", null, {
                    article_id: openModal.data.id,
                    type_mouvement: d.get('type'),
                    quantite: parseInt(d.get('qte'), 10),
                    motif: d.get('motif')
                });
            }}>
                <Stack spacing={3}>
                    <TextField name="type" select label="NATURE DE L'OPÉRATION" defaultValue="ENTRÉE" fullWidth variant="filled" InputProps={{ style: { color: TEXT_PRIMARY, backgroundColor: ROW_HOVER } }} InputLabelProps={{ style: { color: 'gray' } }}>
                        <MenuItem value="ENTRÉE">ENTRÉE (Réapprovisionnement)</MenuItem>
                        <MenuItem value="SORTIE">SORTIE (Distribution / Consommation)</MenuItem>
                    </TextField>
                    <TextField name="qte" label="QUANTITÉ DÉPLACÉE" type="number" fullWidth required variant="filled" InputProps={{ style: { color: TEXT_PRIMARY, fontSize: '1.5rem', fontWeight: 900, backgroundColor: ROW_HOVER } }} InputLabelProps={{ style: { color: 'gray' } }} />
                    <TextField name="motif" label="MOTIF / DESTINATION / BÉNÉFICIAIRE" multiline rows={2} fullWidth required variant="filled" InputProps={{ style: { color: TEXT_PRIMARY, backgroundColor: ROW_HOVER } }} InputLabelProps={{ style: { color: 'gray' } }} />
                    <Button type="submit" variant="contained" fullWidth sx={{ bgcolor: isDarkMode ? DRC_YELLOW : '#F0C800', color: "#000", fontWeight: 900, py: 1.5, '&:hover': {bgcolor: '#D1AF00'} }}>EXÉCUTER L'OPÉRATION</Button>
                </Stack>
            </form>
          </Box>
        </Fade>
      </Modal>

      {/* MODALE 3 : AUDIT & HISTORIQUE DES MODIFICATIONS */}
      <Modal open={openModal.type === 'HISTORY'} onClose={() => setOpenModal({ type: null, data: null })}>
        <Fade in={openModal.type === 'HISTORY'}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: {xs:'95%', md: 800}, maxHeight: '80vh', overflowY: 'auto', bgcolor: PAPER_BG, p: 4, border: `1px solid ${DRC_BLUE}`, boxShadow: 24 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, color: DRC_BLUE, borderBottom: `1px solid ${alpha(DRC_BLUE, 0.3)}`, pb: 1 }}>PROTOCOLE D'AUDIT : {openModal.data?.nom?.toUpperCase()}</Typography>
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', borderRadius: 0, boxShadow: 'none' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: isDarkMode ? alpha(DRC_BLUE, 0.1) : alpha(DRC_BLUE, 0.05) }}>
                  <TableRow>
                    <TableCell sx={{ color: DRC_BLUE, fontWeight: 900 }}>CHAMP MODIFIÉ</TableCell>
                    <TableCell sx={{ color: DRC_RED, fontWeight: 900 }}>VALEUR ANTÉRIEURE</TableCell>
                    <TableCell sx={{ color: isDarkMode ? "#00ff00" : "#009900", fontWeight: 900 }}>NOUVELLE VALEUR</TableCell>
                    <TableCell sx={{ color: "gray", fontWeight: 900 }}>OPÉRATEUR</TableCell>
                    <TableCell sx={{ color: "gray", fontWeight: 900 }}>HORODATAGE</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {openModal.data?.historique?.map((h, i) => (
                    <TableRow key={i} sx={{ '&:hover': { bgcolor: ROW_HOVER } }}>
                      <TableCell sx={{ color: TEXT_PRIMARY, borderBottom: `1px solid ${BORDER_COLOR}` }}>{h.champ.toUpperCase()}</TableCell>
                      <TableCell sx={{ color: isDarkMode ? alpha(DRC_RED, 0.7) : DRC_RED, borderBottom: `1px solid ${BORDER_COLOR}` }}>{h.ancienne_valeur}</TableCell>
                      <TableCell sx={{ color: isDarkMode ? "#00ff00" : "#009900", fontWeight: 700, borderBottom: `1px solid ${BORDER_COLOR}` }}>{h.nouvelle_valeur}</TableCell>
                      <TableCell sx={{ color: TEXT_PRIMARY, borderBottom: `1px solid ${BORDER_COLOR}` }}>{h.operateur}</TableCell>
                      <TableCell sx={{ color: "gray", fontSize: '0.75rem', borderBottom: `1px solid ${BORDER_COLOR}` }}>{new Date(h.date_modification).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {(!openModal.data?.historique || openModal.data.historique.length === 0) && (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'gray' }}>Aucune trace de modification détectée pour cette ressource.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Fade>
      </Modal>

      <Snackbar open={toast.open} autoHideDuration={5000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.sev} variant="filled" sx={{ fontWeight: 900, borderRadius: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{toast.msg.toUpperCase()}</Alert>
      </Snackbar>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0px ${alpha(DRC_RED, 0.6)}; }
          70% { box-shadow: 0 0 0 15px rgba(206, 16, 33, 0); }
          100% { box-shadow: 0 0 0 0px rgba(206, 16, 33, 0); }
        }
      `}</style>
    </Box>
  );
};

export default GestionStocks;