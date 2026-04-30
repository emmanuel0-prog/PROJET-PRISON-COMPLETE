import React, { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Grid, Card, CardContent, 
  Button, TextField, InputAdornment, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  IconButton, Chip, Avatar, Tooltip, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, 
  alpha, Menu, MenuItem, Fade, useTheme
} from "@mui/material";
import {
  Search, Add, Edit, Delete, FilterList, 
  PeopleAlt, Security, AdminPanelSettings, 
  TrendingUp, Visibility, FileDownload, 
  Description, TableChart, Refresh, Warning
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import api from "../../../api"; // Import de l'instance axios préconfigurée

// --- PALETTE HIGH-TECH RDC (Couleurs de base) ---
const COLORS = {
  blue: "#007FFF",
  red: "#CE1126",
  yellow: "#F7D618",
};

const GestionAgents = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';

  // --- COULEURS DYNAMIQUES (Clair / Sombre) ---
  const dynamicStyles = {
    bgApp: isDark ? "#070E1D" : "#F1F5F9",
    bgCard: isDark ? "#111827" : "#FFFFFF",
    textMain: isDark ? "#F8FAFC" : "#0F172A",
    textSub: isDark ? "#94A3B8" : "text.secondary",
    border: isDark ? "#1E293B" : "#E2E8F0",
    inputBg: isDark ? "#1E293B" : "#FFFFFF",
    glass: isDark ? "rgba(17, 24, 39, 0.8)" : "rgba(255, 255, 255, 0.9)",
  };

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  useEffect(() => { fetchAgents(); }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await api.get("/agents/");
      setAgents(res.data);
    } catch (err) { console.error("Erreur:", err); }
    setLoading(false);
  };

  // --- LOGIQUE DE SUPPRESSION ---
  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/agents/${deleteId}/`);
      setAgents(agents.filter(a => a.id !== deleteId)); // Met à jour la liste sans recharger la page
      setDeleteId(null);
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      // Ici tu pourras ajouter une notification d'erreur plus tard
    }
  };

  // --- LOGIQUE D'EXPORTATION ---
  const handleExportMenu = (event) => setExportAnchorEl(event.currentTarget);
  const handleExportClose = () => setExportAnchorEl(null);

  const exportData = (format) => {
    const dataToExport = filteredAgents.map(a => ({
      Matricule: a.matricule,
      Nom: a.nom,
      Prenom: a.prenom,
      Secteur: a.secteur,
      Statut: a.statut,
      Grade: a.grade,
      Email: a.email_professionnel
    }));

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Agents");
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([excelBuffer]), `Rapport_Personnel_RDC_${new Date().toLocaleDateString()}.xlsx`);
    } else {
      const csvContent = "data:text/csv;charset=utf-8," + 
        ["Matricule,Nom,Prenom,Secteur,Statut,Grade"].join(",") + "\n" +
        dataToExport.map(e => Object.values(e).join(",")).join("\n");
      saveAs(encodeURI(csvContent), `Export_Agents.csv`);
    }
    handleExportClose();
  };

  const stats = {
    total: agents.length,
    securite: agents.filter(a => a.secteur === "SECURITE").length,
    officiers: agents.filter(a => a.est_officier_judiciaire).length,
    enPoste: agents.filter(a => a.statut === "EN POSTE").length,
  };

  const filteredAgents = agents.filter(a => 
    `${a.nom} ${a.prenom} ${a.matricule}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: dynamicStyles.bgApp, minHeight: "100vh", transition: "background-color 0.3s" }}>
      
      {/* --- HEADER ULTRA-MODERNE --- */}
      <Box sx={{ mb: 5, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <Box>
          <Typography variant="h3" fontWeight={900} sx={{ color: dynamicStyles.textMain, letterSpacing: "-1px" }}>
            CENTRE DE GESTION <span style={{ color: COLORS.blue, textShadow: isDark ? `0 0 10px ${alpha(COLORS.blue, 0.5)}` : 'none' }}>AGENT-X</span>
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#10B981", animation: "pulse 2s infinite" }} />
            <Typography variant="body2" fontWeight={600} sx={{ color: dynamicStyles.textSub }}>Système Biométrique National Connecté</Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            startIcon={<FileDownload />} 
            onClick={handleExportMenu}
            sx={{ borderRadius: "12px", borderWidth: "2px", fontWeight: 700, borderColor: COLORS.blue, color: isDark ? "#60A5FA" : COLORS.blue, "&:hover": { borderWidth: "2px" } }}
          >
            Exporter Rapport
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            sx={{ bgcolor: COLORS.blue, borderRadius: "12px", fontWeight: 800, px: 3, boxShadow: `0 10px 20px ${alpha(COLORS.blue, 0.3)}`, "&:hover": { bgcolor: "#0066CC" } }}
            onClick={() => navigate('/personnel/biometriepersonnel')}
          >
            NOUVEL ENRÔLEMENT
          </Button>
        </Stack>
      </Box>

      {/* --- DATA CARDS (STATS) --- */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {[
          { label: "EFFECTIF TOTAL", val: stats.total, icon: <PeopleAlt />, color: COLORS.blue, progress: 100 },
          { label: "CORPS SÉCURITÉ", val: stats.securite, icon: <Security />, color: "#10B981", progress: stats.total ? (stats.securite/stats.total)*100 : 0 },
          { label: "OFFICIERS (OPJ)", val: stats.officiers, icon: <AdminPanelSettings />, color: COLORS.red, progress: stats.total ? (stats.officiers/stats.total)*100 : 0 },
          { label: "PRÉSENCE JOUR", val: `${Math.round(stats.total ? (stats.enPoste/stats.total)*100 : 0)}%`, icon: <TrendingUp />, color: "#F59E0B", progress: stats.total ? (stats.enPoste/stats.total)*100 : 0 },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ 
              borderRadius: "24px", 
              bgcolor: dynamicStyles.bgCard,
              border: `1px solid ${dynamicStyles.border}`,
              transition: "transform 0.3s ease",
              "&:hover": { transform: "translateY(-5px)", boxShadow: isDark ? "0 20px 40px rgba(0,0,0,0.5)" : "0 20px 40px rgba(0,0,0,0.05)" }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: alpha(s.color, isDark ? 0.2 : 0.1), color: s.color, width: 56, height: 56, borderRadius: "16px" }}>
                    {s.icon}
                  </Avatar>
                  <Typography variant="h4" fontWeight={900} color={dynamicStyles.textMain}>{s.val}</Typography>
                </Stack>
                <Typography variant="caption" fontWeight={800} sx={{ color: dynamicStyles.textSub, letterSpacing: 1 }}>{s.label}</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={s.progress} 
                  sx={{ mt: 2, height: 6, borderRadius: 3, bgcolor: alpha(s.color, 0.1), "& .MuiLinearProgress-bar": { bgcolor: s.color } }} 
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* --- TABLEAU SMART DATA --- */}
      <Paper sx={{ 
        borderRadius: "24px", 
        overflow: "hidden", 
        bgcolor: dynamicStyles.glass,
        backdropFilter: "blur(10px)",
        border: `1px solid ${dynamicStyles.border}`,
        boxShadow: isDark ? "0 4px 30px rgba(0,0,0,0.3)" : "0 4px 30px rgba(0,0,0,0.03)"
      }}>
        <Box sx={{ p: 3, display: "flex", gap: 2, alignItems: "center" }}>
          <TextField 
            fullWidth
            placeholder="Rechercher un agent par nom, ID ou matricule..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ 
              startAdornment: <InputAdornment position="start"><Search sx={{ color: isDark ? "#94A3B8" : COLORS.blue }} /></InputAdornment>,
              sx: { 
                borderRadius: "16px", 
                bgcolor: dynamicStyles.inputBg, 
                color: dynamicStyles.textMain,
                "& fieldset": { borderColor: dynamicStyles.border } 
              }
            }}
          />
          <IconButton sx={{ p: 1.5, bgcolor: dynamicStyles.inputBg, color: dynamicStyles.textMain, borderRadius: "16px", border: `1px solid ${dynamicStyles.border}` }}><FilterList /></IconButton>
          <IconButton onClick={fetchAgents} sx={{ p: 1.5, bgcolor: dynamicStyles.inputBg, color: dynamicStyles.textMain, borderRadius: "16px", border: `1px solid ${dynamicStyles.border}` }}><Refresh /></IconButton>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: isDark ? "#1E293B" : alpha(COLORS.blue, 0.02) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: dynamicStyles.textMain }}>AGENT</TableCell>
                <TableCell sx={{ fontWeight: 800, color: dynamicStyles.textMain }}>MATRICULE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: dynamicStyles.textMain }}>FONCTION</TableCell>
                <TableCell sx={{ fontWeight: 800, color: dynamicStyles.textMain }}>STATUT</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: dynamicStyles.textMain }}>OPÉRATIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id} hover sx={{ "& td": { py: 2, borderBottom: `1px solid ${dynamicStyles.border}` }, "&:hover": { bgcolor: isDark ? "#1E293B" : "rgba(0,0,0,0.04)" } }}>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar src={agent.photo} sx={{ width: 48, height: 48, borderRadius: "14px", border: `2px solid ${alpha(COLORS.blue, 0.2)}` }}>
                        {agent.nom[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight={800} color={dynamicStyles.textMain}>{agent.nom} {agent.prenom}</Typography>
                        <Typography variant="caption" sx={{ color: dynamicStyles.textSub }}>{agent.grade || "Agent Territorial"}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label={agent.matricule} sx={{ fontWeight: 900, borderRadius: "8px", fontFamily: "monospace", bgcolor: alpha(COLORS.blue, isDark ? 0.2 : 0.05), color: isDark ? "#93C5FD" : COLORS.blue }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color={dynamicStyles.textMain}>{agent.secteur}</Typography>
                    <Typography variant="caption" display="block" sx={{ color: dynamicStyles.textSub }}>Affecté à : Kinshasa Gombe</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={agent.statut} 
                      size="small" 
                      sx={{ 
                        fontWeight: 900, 
                        bgcolor: agent.statut === "EN POSTE" ? alpha("#10B981", isDark ? 0.2 : 0.1) : alpha(COLORS.red, isDark ? 0.2 : 0.1),
                        color: agent.statut === "EN POSTE" ? "#10B981" : (isDark ? "#FCA5A5" : COLORS.red),
                        borderRadius: "6px"
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      
                      {/* BOUTON VOIR PROFIL */}
                      <Tooltip title="Voir le Profil Complet">
                        <IconButton 
                          onClick={() => navigate(`/personnel/gestion/profil/${agent.id}`)} 
                          sx={{ color: isDark ? "#60A5FA" : COLORS.blue, bgcolor: alpha(COLORS.blue, isDark ? 0.1 : 0.05), "&:hover": { bgcolor: alpha(COLORS.blue, 0.2) } }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {/* BOUTON MODIFIER - NOUVELLE FONCTIONNALITÉ */}
                      <Tooltip title="Modifier les informations">
                        <IconButton 
                          onClick={() => navigate(`/personnel/biometriepersonnel/${agent.id}`)}
                          sx={{ color: isDark ? "#FCD34D" : COLORS.yellow, bgcolor: alpha(COLORS.yellow, isDark ? 0.1 : 0.05), "&:hover": { bgcolor: alpha(COLORS.yellow, 0.2) } }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {/* BOUTON SUPPRIMER */}
                      <Tooltip title="Supprimer l'agent">
                        <IconButton 
                          onClick={() => setDeleteId(agent.id)} 
                          sx={{ color: isDark ? "#FCA5A5" : COLORS.red, bgcolor: alpha(COLORS.red, isDark ? 0.1 : 0.05), "&:hover": { bgcolor: alpha(COLORS.red, 0.2) } }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>

                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* --- MODALE DE CONFIRMATION DE SUPPRESSION --- */}
      <Dialog 
        open={deleteId !== null} 
        onClose={() => setDeleteId(null)}
        PaperProps={{
          sx: {
            bgcolor: dynamicStyles.bgCard,
            color: dynamicStyles.textMain,
            borderRadius: "16px",
            border: `1px solid ${isDark ? COLORS.red : "transparent"}`,
            boxShadow: isDark ? `0 0 30px ${alpha(COLORS.red, 0.2)}` : 24
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.red, fontWeight: 900 }}>
          <Warning /> CONFIRMATION DE SUPPRESSION
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: dynamicStyles.textSub, mt: 1 }}>
            Êtes-vous sûr de vouloir supprimer définitivement cet agent de la base de données biométrique ? Cette action est irréversible et sera journalisée.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ color: dynamicStyles.textSub, fontWeight: 700 }}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" sx={{ bgcolor: COLORS.red, fontWeight: 800, "&:hover": { bgcolor: "#990000" } }}>
            CONFIRMER LA SUPPRESSION
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- MENU EXPORTATION --- */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
        TransitionComponent={Fade}
        PaperProps={{ sx: { bgcolor: dynamicStyles.bgCard, color: dynamicStyles.textMain, border: `1px solid ${dynamicStyles.border}` } }}
      >
        <MenuItem onClick={() => exportData('excel')} sx={{ py: 1.5, minWidth: 200, "&:hover": { bgcolor: alpha(COLORS.blue, 0.1) } }}>
          <TableChart sx={{ mr: 2, color: "#1D6F42" }} /> 
          <Typography fontWeight={700}>Exporter en Excel (.xlsx)</Typography>
        </MenuItem>
        <MenuItem onClick={() => exportData('csv')} sx={{ py: 1.5, "&:hover": { bgcolor: alpha(COLORS.blue, 0.1) } }}>
          <Description sx={{ mr: 2, color: isDark ? "#94A3B8" : "#1E293B" }} /> 
          <Typography fontWeight={700}>Exporter en CSV (.csv)</Typography>
        </MenuItem>
      </Menu>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </Box>
  );
};

// --- HELPER STACK ---
const Stack = ({ children, direction = "row", spacing = 0, alignItems = "center", justifyContent = "flex-start", sx = {} }) => (
  <Box sx={{ display: "flex", flexDirection: direction, gap: spacing, alignItems, justifyContent, ...sx }}>
    {children}
  </Box>
);

export default GestionAgents;