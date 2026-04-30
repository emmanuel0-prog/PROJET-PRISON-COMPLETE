import React, { useState, useEffect } from "react";
import {
  Box, Typography, useTheme, alpha, Button, Grid, Stack, Paper, 
  IconButton, Divider, Chip, Skeleton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, MenuItem, Menu
} from "@mui/material";
import { DataGrid, frFR } from "@mui/x-data-grid";
import {
  AddBoxOutlined, FileDownloadOutlined, PictureAsPdfOutlined,
  TableChartOutlined, DescriptionOutlined, CloseOutlined,
  PrintOutlined, ShieldOutlined
} from "@mui/icons-material";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Assets
import sceauRdc from "../../../assets/gouvernement rdc.png";
import drapeauRdc from "../../../assets/rdc.png";
import api from "../../../api"; // ✅ API CENTRALISÉE

const DRC_BLUE = "#007FFF";
const DRC_YELLOW = "#F7D618";
const DRC_RED = "#CE1021";

const CalendrierVisites = () => {
  const theme = useTheme();
  const bc = theme.palette.mode === "dark" ? "#fff" : "#000";
  const inv = theme.palette.mode === "dark" ? "#000" : "#fff";

  // --- ÉTATS ---
  const [loading, setLoading] = useState(false);
  const [visites, setVisites] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [openModal, setOpenModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null); // Pour le menu export

  const [formData, setFormData] = useState({
    nom_complet: "",
    detenu_visite: "",
    type_visiteur: "FAMILLE",
    relation_detenu: "",
    token: `VISIT-${Math.floor(1000 + Math.random() * 9000)}`
  });

  // --- CHARGEMENT ---
  const fetchVisites = async () => {
    setLoading(true);
    try {
      // Filtrage par date au niveau du backend
      const res = await api.get(`/visiteurs/?date=${selectedDate}`);
      setVisites(res.data);
    } catch (err) { console.error("Erreur API:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVisites(); }, [selectedDate]);

  // --- LOGIQUE D'EXPORTATION ---
  
  // 1. Export EXCEL & CSV
  const exportData = (type) => {
    const dataToExport = visites.map(v => ({
      Token: v.token,
      Visiteur: v.nom_complet,
      Détenu: v.detenu_visite_nom, // Assumé via Serializer
      Type: v.type_visiteur,
      Statut: v.statut,
      Entrée: new Date(v.heure_entree).toLocaleTimeString()
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Visites");
    
    if (type === 'xlsx') {
      XLSX.writeFile(wb, `Visites_RDC_${selectedDate}.xlsx`);
    } else {
      XLSX.writeFile(wb, `Visites_RDC_${selectedDate}.csv`, { bookType: 'csv' });
    }
    setAnchorEl(null);
  };

  // 2. Export PDF (Format Officiel)
  const exportPDF = () => {
    const doc = new jsPDF();
    
    // En-tête RDC
    doc.addImage(sceauRdc, 'PNG', 10, 10, 20, 20);
    doc.setFontSize(10);
    doc.text("RÉPUBLIQUE DÉMOCRATIQUE DU CONGO", 105, 15, { align: "center" });
    doc.setFont(undefined, 'bold');
    doc.text("MINISTÈRE DE LA JUSTICE", 105, 20, { align: "center" });
    doc.text("DIRECTION GÉNÉRALE DES PRISONS", 105, 25, { align: "center" });
    
    doc.setFontSize(14);
    doc.text(`REGISTRE DES VISITES DU : ${selectedDate}`, 105, 40, { align: "center" });

    autoTable(doc, {
      startY: 45,
      head: [['TOKEN', 'VISITEUR', 'DÉTENU', 'TYPE', 'STATUT', 'HEURE']],
      body: visites.map(v => [
        v.token, 
        v.nom_complet?.toUpperCase(), 
        v.detenu_visite_nom, 
        v.type_visiteur, 
        v.statut,
        new Date(v.heure_entree).toLocaleTimeString()
      ]),
      headStyles: { fillColor: [0, 127, 255] },
      styles: { fontSize: 8, font: 'helvetica' }
    });

    doc.save(`Registre_Visites_${selectedDate}.pdf`);
    setAnchorEl(null);
  };

  // --- ACTIONS ---
  const handleSubmit = async () => {
    try {
      await api.post("/visiteurs/", formData);
      setOpenModal(false);
      fetchVisites();
    } catch (err) { alert("Erreur d'enregistrement."); }
  };

  const columns = [
    { field: "token", headerName: "ID / TOKEN", width: 120, renderCell: (p) => <Chip label={p.value} size="small" variant="outlined" sx={{ fontWeight: 900, borderRadius: 0 }} /> },
    { field: "nom_complet", headerName: "VISITEUR", flex: 1, renderCell: (p) => <Typography fontWeight={800}>{p.value?.toUpperCase()}</Typography> },
    { field: "detenu_visite_nom", headerName: "DÉTENU CIBLE", flex: 1 },
    { field: "type_visiteur", headerName: "CATÉGORIE", width: 150, renderCell: ({ value }) => (
      <Chip label={value} size="small" sx={{ 
        bgcolor: value === 'AVOCAT' ? alpha(DRC_YELLOW, 0.2) : value === 'OFFICIEL' ? alpha(DRC_RED, 0.1) : 'transparent',
        border: `1px solid ${bc}`, fontWeight: 900, borderRadius: 0 
      }} />
    )},
    { field: "statut", headerName: "STATUT", width: 130, renderCell: (p) => (
      <Typography variant="caption" fontWeight={900} color={p.value === 'EN ATTENTE' ? DRC_YELLOW : p.value === 'TERMINE' ? 'success.main' : DRC_RED}>
        ● {p.value}
      </Typography>
    )},
  ];

  return (
    <Box sx={{ p: 4, bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      
      {/* HEADER PROTOCOLAIRE */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4} sx={{ borderBottom: `4px solid ${bc}`, pb: 2 }}>
        <Box display="flex" alignItems="center" gap={3}>
          <Box component="img" src={sceauRdc} sx={{ height: 70 }} />
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: "-1px" }}>GESTION DES PARLOIRS</Typography>
            <Typography variant="body2" fontWeight={800} sx={{ color: DRC_BLUE }}>CONTRÔLE DES FLUX ET ACCÈS SÉCURISÉS</Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            startIcon={<FileDownloadOutlined />} 
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ border: `2px solid ${bc}`, color: bc, fontWeight: 900, borderRadius: 0 }}
          >
            EXPORTER LE REGISTRE
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddBoxOutlined />} 
            onClick={() => setOpenModal(true)}
            sx={{ bgcolor: DRC_BLUE, color: "#fff", fontWeight: 900, borderRadius: 0, px: 3 }}
          >
            ENREGISTRER VISITEUR
          </Button>
        </Stack>
      </Box>

      {/* MENU EXPORT */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={exportPDF} sx={{ fontWeight: 800 }}><PictureAsPdfOutlined sx={{ mr: 1, color: DRC_RED }} /> Format PDF Officiel</MenuItem>
        <MenuItem onClick={() => exportData('xlsx')} sx={{ fontWeight: 800 }}><TableChartOutlined sx={{ mr: 1, color: 'success.main' }} /> Format Excel (.xlsx)</MenuItem>
        <MenuItem onClick={() => exportData('csv')} sx={{ fontWeight: 800 }}><DescriptionOutlined sx={{ mr: 1 }} /> Format CSV</MenuItem>
      </Menu>

      <Grid container spacing={3}>
        {/* FILTRE DATE & CALENDRIER RAPIDE */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, border: `2px solid ${bc}`, borderRadius: 0, boxShadow: "none" }}>
            <Typography variant="subtitle2" fontWeight={900} mb={2}>SÉLECTIONNER UNE DATE</Typography>
            <TextField 
              type="date" 
              fullWidth 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              InputProps={{ sx: { borderRadius: 0, fontWeight: 900 } }}
            />
            <Divider sx={{ my: 2, bgcolor: bc }} />
            <Stack spacing={1}>
              <AlertSeverity severity="info" text="Total Prévu: " count={visites.length} />
              <AlertSeverity severity="warning" text="En Parloir: " count={visites.filter(v => v.statut === 'EN PARLOIR').length} />
            </Stack>
          </Paper>
        </Grid>

        {/* LISTE PRINCIPALE */}
        <Grid item xs={12} md={9}>
          <Box sx={{ border: `2px solid ${bc}`, position: 'relative' }}>
            <Box sx={{ bgcolor: bc, color: inv, p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" fontWeight={900}>REGISTRE DU {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</Typography>
              <IconButton size="small" onClick={fetchVisites} sx={{ color: inv }}><PrintOutlined /></IconButton>
            </Box>
            <Box sx={{ height: 600, width: '100%', bgcolor: theme.palette.background.paper }}>
              <DataGrid 
                rows={visites} 
                columns={columns} 
                loading={loading}
                localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                sx={{ 
                  borderRadius: 0,
                  "& .MuiDataGrid-columnHeader": { bgcolor: alpha(bc, 0.05), fontWeight: 900 },
                  border: "none"
                }} 
              />
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* DIALOGUE D'ENREGISTREMENT (Comme précédemment avec vos nouveaux champs) */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 0, border: `4px solid ${bc}` } }}>
          {/* ... Contenu du formulaire identique en adaptant les champs (nom_complet, detenu_visite, etc.) ... */}
      </Dialog>
    </Box>
  );
};

// Petit composant interne pour les stats
const AlertSeverity = ({ severity, text, count }) => (
  <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', bgcolor: alpha(severity === 'info' ? '#007FFF' : '#F7D618', 0.1), borderLeft: `4px solid ${severity === 'info' ? '#007FFF' : '#F7D618'}` }}>
    <Typography variant="caption" fontWeight={900}>{text}</Typography>
    <Typography variant="caption" fontWeight={900}>{count}</Typography>
  </Box>
);

export default CalendrierVisites;