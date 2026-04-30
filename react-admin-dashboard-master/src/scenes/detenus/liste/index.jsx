import React, { useState, useEffect } from "react";
import {
  Box, Typography, useTheme, Chip, Avatar, Button, Stack, TextField, 
  InputAdornment, Tooltip, IconButton, alpha, Paper, Dialog, DialogTitle, 
  DialogContent, List, ListItem, ListItemText, Divider, Grid, Menu, MenuItem
} from "@mui/material";
import { DataGrid, frFR } from "@mui/x-data-grid";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Search, FileDownloadOutlined, DeleteOutline, EditOutlined, FolderShared, 
  ShieldOutlined, GavelOutlined, PeopleOutline, FactCheckOutlined, BusinessOutlined,
  WcOutlined, HistoryOutlined, Close, CheckCircleOutlined, PictureAsPdfOutlined,
  TableViewOutlined, DescriptionOutlined, PendingActionsOutlined, BalanceOutlined, NoAccountsOutlined
} from "@mui/icons-material";

// Importations pour l'export Excel et PDF
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import api from "../../../api"; // Import de l'instance Axios sécurisée

// =========================================================================
// 🚀 INSTANCE AXIOS "HIGH-TECH" AVEC INTERCEPTEURS (REQUÊTES & RÉPONSES)
// =========================================================================

// COULEURS OFFICIELLES RDC & ALERTES
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1021";
const SUCCESS_GREEN = "#10B981"; // Pour les libérés
const FEMALE_PINK = "#E91E63";
const ORANGE_WARNING = "#FF9800"; // Condamnés préventifs
const BLACK_DEATH = "#212121"; // Pour les décès

// COMPOSANT STAT CARD (Amélioré pour une meilleure visibilité)
const StatCard = ({ title, value, subValue, icon, color, bc }) => (
  <Paper sx={{ 
    p: 2.5, border: `2px solid ${bc}`, borderRadius: 0, boxShadow: "none", 
    height: "100%", position: "relative", overflow: "hidden", bgcolor: alpha(bc, 0.02)
  }}>
    <Box sx={{ position: "absolute", top: 0, left: 0, width: "6px", height: "100%", bgcolor: color }} />
    <Stack direction="row" justifyContent="space-between" alignItems="center" height="100%">
      <Box ml={1}>
        <Typography variant="subtitle1" fontWeight={900} sx={{ opacity: 0.8, textTransform: "uppercase", letterSpacing: 1, fontSize: "1.1rem" }}>
          {title}
        </Typography>
        <Typography variant="h3" fontWeight={900} sx={{ my: 0.5 }}>{value}</Typography>
        <Typography variant="body1" fontWeight={800} sx={{ color: color, fontSize: "1rem" }}>
          {subValue}
        </Typography>
      </Box>
      <Box sx={{ opacity: 0.2 }}>
        {React.cloneElement(icon, { sx: { fontSize: 60, color: bc } })}
      </Box>
    </Stack>
  </Paper>
);

// COMPOSANT MODALE HISTORIQUE
const HistoriqueDialog = ({ open, onClose, history, bc }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 0, border: `3px solid ${bc}` } }}>
    <DialogTitle sx={{ bgcolor: bc, color: (bc === "#000" ? "#fff" : "#000"), fontWeight: 900, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "1.3rem" }}>
      HISTORIQUE DES AUDITS
      <IconButton onClick={onClose} size="large" sx={{ color: "inherit" }}><Close fontSize="large" /></IconButton>
    </DialogTitle>
    <DialogContent dividers>
      <List>
        {history.length > 0 ? history.map((item, index) => (
          <React.Fragment key={index}>
            <ListItem alignItems="flex-start" sx={{ px: 0 }}>
              <ListItemText
                primary={
                  <Stack direction="row" justifyContent="space-between">
                    <Typography fontWeight={900} variant="h6" color={RDC_BLUE}>{item.action}</Typography>
                    <Typography variant="body1" fontWeight={700}>{new Date(item.date).toLocaleString('fr-FR')}</Typography>
                  </Stack>
                }
                secondary={
                  <Box mt={0.5}>
                    <Typography variant="body1" color="text.primary" fontWeight={700} fontSize="1.1rem">{item.description}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, fontStyle: "italic", fontSize: "1rem" }}>
                      Agent: {item.utilisateur} | IP: {item.ip}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            <Divider />
          </React.Fragment>
        )) : (
          <Typography sx={{ py: 4, textAlign: "center", fontWeight: 900, fontSize: "1.2rem", opacity: 0.5 }}>AUCUNE MODIFICATION ENREGISTRÉE</Typography>
        )}
      </List>
    </DialogContent>
  </Dialog>
);

const ListeDetenus = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === "dark";
  const bc = isDark ? "#fff" : "#000";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  
  // États pour l'historique
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);

  // États pour le menu d'export
  const [anchorEl, setAnchorEl] = useState(null);
  const exportOpen = Boolean(anchorEl);

  useEffect(() => { fetchDetenus(); }, []);

  // 📡 Récupération des détenus via l'API sécurisée
  const fetchDetenus = async () => {
    try {
      const response = await api.get("detenus/");
      setRows(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur de chargement:", error);
      setLoading(false);
    }
  };

  // 📡 Récupération de l'historique via l'API sécurisée
  const viewHistory = async (id) => {
    try {
      const response = await api.get(`detenus/${id}/historique/`);
      setSelectedHistory(response.data);
      setHistoryOpen(true);
    } catch (error) {
      alert("Erreur lors de la récupération de l'historique.");
    }
  };

  // 📡 Suppression via l'API sécurisée
  const handleDelete = async (id) => {
    if (window.confirm("CONFIRMATION : Envoyer ce dossier à la corbeille ?")) {
      try {
        await api.delete(`detenus/${id}/`);
        setRows((prev) => prev.filter((r) => r.id !== id));
      } catch (error) {
        alert("Erreur lors de la mise en corbeille.");
      }
    }
  };

  // Filtrage de la recherche
  const filteredRows = rows.filter((row) => {
    const search = searchText.toLowerCase();
    return (
      row.matricule?.toLowerCase().includes(search) || 
      row.nom?.toLowerCase().includes(search) || 
      row.postnom?.toLowerCase().includes(search)
    );
  });

  // === FONCTIONS D'EXPORTATION ===
  const formatDataForExport = () => {
    return filteredRows.map(row => ({
      "N° Écrou": row.matricule,
      "Nom": row.nom,
      "Post-nom": row.postnom,
      "Prénom": row.prenom,
      "Sexe": row.sexe === 'M' ? 'Masculin' : 'Féminin',
      "Lieu de Détention": row.prison_info?.nom || row.prison_nom || "NON-ASSIGNÉ",
      "Situation": row.statut_juridique?.replace('_', ' ') || "INCONNU"
    }));
  };

  const exportToExcel = () => {
    const data = formatDataForExport();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Détenus");
    XLSX.writeFile(workbook, "Registre_Detenus.xlsx");
    setAnchorEl(null);
  };

  const exportToCSV = () => {
    const data = formatDataForExport();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Registre_Detenus.csv";
    link.click();
    setAnchorEl(null);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("REGISTRE GÉNÉRAL DES DÉTENUS", 14, 15);
    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);

    const tableColumn = ["N° Écrou", "Identité", "Sexe", "Lieu de Détention", "Situation"];
    const tableRows = [];

    filteredRows.forEach(row => {
      const identite = `${row.nom} ${row.postnom} ${row.prenom}`;
      const sexe = row.sexe === 'M' ? 'M' : 'F';
      const prison = row.prison_info?.nom || row.prison_nom || "N/A";
      const statut = row.statut_juridique?.replace('_', ' ') || "N/A";
      tableRows.push([row.matricule, identite, sexe, prison, statut]);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 127, 255] } // RDC Blue
    });

    doc.save("Registre_Detenus.pdf");
    setAnchorEl(null);
  };

  // === COLONNES DU TABLEAU (Polices agrandies pour lisibilité) ===
  const columns = [
    {
      field: "matricule",
      headerName: "N° ÉCROU",
      width: 140,
      renderCell: (params) => <Typography fontWeight={900} sx={{ color: RDC_BLUE, fontSize: "1.1rem" }}>{params.value || "PENDING"}</Typography>,
    },
    {
      field: "identite",
      headerName: "DÉTENU / IDENTITÉ",
      flex: 1.5,
      renderCell: ({ row }) => (
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar src={row.photo} variant="square" sx={{ width: 45, height: 45, border: `1px solid ${bc}`, borderRadius: 0 }} />
          <Box>
            <Typography variant="body1" fontWeight={900} sx={{ textTransform: "uppercase", lineHeight: 1.2, fontSize: "1.1rem" }}>{row.nom} {row.postnom}</Typography>
            <Typography variant="body2" sx={{ color: alpha(bc, 0.7), fontWeight: 800, fontSize: "1rem" }}>{row.prenom}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: "sexe",
      headerName: "SEXE",
      width: 90,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Typography fontWeight={900} sx={{ color: params.value === 'F' ? FEMALE_PINK : RDC_BLUE, fontSize: "1.2rem" }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: "prison_nom",
      headerName: "LIEU DE DÉTENTION",
      flex: 1.2,
      renderCell: (params) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <BusinessOutlined sx={{ fontSize: 20, opacity: 0.5 }} />
          <Typography variant="body1" fontWeight={800} fontSize="1.1rem">{params.row.prison_info?.nom || params.row.prison_nom || "NON-ASSIGNÉ"}</Typography>
        </Stack>
      )
    },
    {
      field: "statut_juridique",
      headerName: "SITUATION PÉNALE",
      width: 200,
      renderCell: (params) => {
        let bgColor = RDC_BLUE;
        let textColor = "#fff";
        
        if (params.value === "CONDAMNE") { bgColor = RDC_RED; }
        else if (params.value === "PREVENU") { bgColor = RDC_YELLOW; textColor = "#000"; }
        else if (params.value === "DETENU_PREVENTIF") { bgColor = ORANGE_WARNING; textColor = "#000"; }
        else if (params.value === "CONDAMNE_PREVENTIF") { bgColor = "#8E24AA"; } // Violet pour les condamnés avec autre dossier en prévention
        else if (params.value === "LIBERE") { bgColor = SUCCESS_GREEN; }
        else if (params.value === "MORT") { bgColor = BLACK_DEATH; textColor = "#fff"; }

        return (
          <Chip
            label={params.value ? params.value.replace('_', ' ') : "INCONNU"}
            size="medium"
            sx={{
              bgcolor: bgColor, color: textColor, fontWeight: 900, 
              borderRadius: 1, width: "100%", fontSize: "1rem", py: 1
            }}
          />
        );
      },
    },
    {
      field: "nb_modifications",
      headerName: "AUDIT",
      width: 100,
      align: "center",
      renderCell: (params) => (
        <Tooltip title="Cliquer pour voir l'historique" placement="top">
          <Chip
            icon={<HistoryOutlined style={{ fontSize: '18px', color: 'inherit' }} />}
            label={params.value || 0}
            onClick={() => viewHistory(params.row.id)}
            size="medium"
            variant="outlined"
            sx={{
              fontWeight: 900, cursor: "pointer", borderRadius: "6px", fontSize: "1rem",
              borderColor: params.value > 5 ? RDC_RED : alpha(bc, 0.4),
              color: params.value > 5 ? RDC_RED : bc,
              "&:hover": { bgcolor: alpha(bc, 0.1) }
            }}
          />
        </Tooltip>
      )
    },
    {
      field: "actions",
      headerName: "OPTIONS",
      width: 150,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Dossier"><IconButton onClick={() => navigate(`/detenus/${row.id}`)} size="medium" sx={{ color: bc }}><FolderShared fontSize="medium" /></IconButton></Tooltip>
          <Tooltip title="Éditer"><IconButton onClick={() => navigate(`/detenus/edit/${row.id}`)} size="medium" sx={{ color: bc }}><EditOutlined fontSize="medium" /></IconButton></Tooltip>
          <Tooltip title="Corbeille"><IconButton onClick={() => handleDelete(row.id)} size="medium" sx={{ color: RDC_RED }}><DeleteOutline fontSize="medium" /></IconButton></Tooltip>
        </Stack>
      ),
    },
  ];

  // === CALCUL DES STATISTIQUES (Intégrant tous les statuts) ===
  const totalActif = rows.filter(r => r.statut_juridique !== "LIBERE" && r.statut_juridique !== "MORT").length;
  const nbPrevenus = rows.filter(r => r.statut_juridique === "PREVENU").length;
  const nbDetPreventifs = rows.filter(r => r.statut_juridique === "DETENU_PREVENTIF").length;
  const nbCondamnes = rows.filter(r => r.statut_juridique === "CONDAMNE").length;
  const nbCondamnesPrev = rows.filter(r => r.statut_juridique === "CONDAMNE_PREVENTIF").length;
  const nbLiberes = rows.filter(r => r.statut_juridique === "LIBERE").length;
  const nbMorts = rows.filter(r => r.statut_juridique === "MORT").length;
  const nbFemmes = rows.filter(r => r.sexe === "F").length;
  const nbHommes = rows.filter(r => r.sexe === "M").length;

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-end" sx={{ borderBottom: `4px solid ${bc}`, pb: 2, mb: 3, position: "relative" }}>
        <Box sx={{ position: "absolute", bottom: -4, left: 0, width: "100%", height: "4px", display: "flex" }}>
          <Box sx={{ flex: 1, bgcolor: RDC_BLUE }} /><Box sx={{ flex: 1, bgcolor: RDC_YELLOW }} /><Box sx={{ flex: 1, bgcolor: RDC_RED }} />
        </Box>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <ShieldOutlined sx={{ color: RDC_BLUE, fontSize: 30 }} />
            <Typography variant="subtitle1" fontWeight={900} sx={{ letterSpacing: "2px", fontSize: "1.2rem" }}>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</Typography>
          </Stack>
          <Typography variant="h3" fontWeight={900} sx={{ textTransform: "uppercase" }}>REGISTRE GÉNÉRAL DES DÉTENUS</Typography>
          <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 800 }}>MINISTÈRE DE LA JUSTICE | DIRECTION DES SERVICES PÉNITENTIAIRES</Typography>
        </Box>
        <Stack direction="row" spacing={2} mb={1}>
          <Button variant="contained" size="large" sx={{ bgcolor: bc, color: isDark ? "#000" : "#fff", fontWeight: 900, fontSize: "1.1rem", borderRadius: 0 }} onClick={() => navigate("/detenus/nouveau")}>
            + NOUVEL ÉCROU
          </Button>
          
          {/* BOUTON D'EXPORT AVEC MENU */}
          <Button 
            variant="contained" size="large"
            sx={{ bgcolor: RDC_BLUE, color: "#fff", fontWeight: 900, fontSize: "1.1rem", borderRadius: 0 }} 
            startIcon={<FileDownloadOutlined fontSize="large" />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            EXPORTER
          </Button>
          <Menu anchorEl={anchorEl} open={exportOpen} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { borderRadius: 0, border: `2px solid ${bc}`, mt: 1 } }}>
            <MenuItem onClick={exportToExcel} sx={{ fontWeight: 800, fontSize: "1.1rem", py: 1.5 }}><TableViewOutlined sx={{ mr: 2, color: SUCCESS_GREEN, fontSize: 28 }} /> Exporter en Excel</MenuItem>
            <MenuItem onClick={exportToCSV} sx={{ fontWeight: 800, fontSize: "1.1rem", py: 1.5 }}><DescriptionOutlined sx={{ mr: 2, color: RDC_BLUE, fontSize: 28 }} /> Exporter en CSV</MenuItem>
            <MenuItem onClick={exportToPDF} sx={{ fontWeight: 800, fontSize: "1.1rem", py: 1.5 }}><PictureAsPdfOutlined sx={{ mr: 2, color: RDC_RED, fontSize: 28 }} /> Exporter en PDF</MenuItem>
          </Menu>
        </Stack>
      </Box>

      {/* STATS : Grille ajustée pour les 8 cartes de statut */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Actif" value={totalActif} subValue="Population en cours" icon={<PeopleOutline />} color={RDC_BLUE} bc={bc} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Prévenus" value={nbPrevenus} subValue="Non encore jugés" icon={<FactCheckOutlined />} color={RDC_YELLOW} bc={bc} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Dét. Préventifs" value={nbDetPreventifs} subValue="Mandat provisoire" icon={<PendingActionsOutlined />} color={ORANGE_WARNING} bc={bc} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Condamnés" value={nbCondamnes} subValue="Détention ferme" icon={<GavelOutlined />} color={RDC_RED} bc={bc} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Cond. Préventifs" value={nbCondamnesPrev} subValue="Multiples dossiers" icon={<BalanceOutlined />} color="#8E24AA" bc={bc} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Libérés/Expirés" value={nbLiberes} subValue="Sorties enregistrées" icon={<CheckCircleOutlined />} color={SUCCESS_GREEN} bc={bc} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Décédés" value={nbMorts} subValue="Morts en détention" icon={<NoAccountsOutlined />} color={BLACK_DEATH} bc={bc} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Sexe (Actifs)" value={`${nbHommes} H`} subValue={`${nbFemmes} F (Femmes)`} icon={<WcOutlined />} color={FEMALE_PINK} bc={bc} />
        </Grid>
      </Grid>

      {/* RECHERCHE */}
      <Paper sx={{ p: "15px", mb: "20px", borderRadius: 0, border: `2px solid ${bc}`, bgcolor: alpha(bc, 0.02), boxShadow: "none" }}>
        <TextField
          fullWidth placeholder="RECHERCHER PAR NOM, PRÉNOM OU N° ÉCROU..." variant="standard"
          value={searchText} onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            disableUnderline: true,
            startAdornment: <InputAdornment position="start"><Search sx={{ color: RDC_BLUE, ml: 1, fontSize: 32 }} /></InputAdornment>,
            sx: { fontWeight: 900, fontSize: "1.3rem" } // Police de recherche plus grande
          }}
        />
      </Paper>

      {/* DATA GRID */}
      <Box height="65vh" sx={{
        "& .MuiDataGrid-columnHeaders": { bgcolor: bc, color: isDark ? "#000" : "#fff", borderRadius: 0, fontWeight: 900, fontSize: "1.1rem" },
        "& .MuiDataGrid-cell": { borderBottom: `1px solid ${alpha(bc, 0.1)}`, fontWeight: 700, display: 'flex', alignItems: 'center' },
        "& .MuiDataGrid-row:hover": { bgcolor: alpha(RDC_BLUE, 0.05) }
      }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          pageSize={15}
          rowHeight={65} // Hauteur de ligne plus grande pour la lisibilité
        />
      </Box>

      {/* DIALOGUE HISTORIQUE */}
      <HistoriqueDialog open={historyOpen} onClose={() => setHistoryOpen(false)} history={selectedHistory} bc={bc} />
    </Box>
  );
};

export default ListeDetenus;