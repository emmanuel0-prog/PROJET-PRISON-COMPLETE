import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box, Typography, Button, IconButton, useTheme, alpha, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Grid, Avatar, Chip, Stack, Paper, Card, Divider, CircularProgress
} from "@mui/material";
import { DataGrid, frFR } from "@mui/x-data-grid";
import {
  BadgeOutlined, FingerprintOutlined, EventNoteOutlined,
  AddModeratorOutlined, AssignmentIndOutlined, PrintOutlined,
  PhotoCamera, EditOutlined, DeleteOutline, VerifiedUserOutlined,
  VisibilityOutlined
} from "@mui/icons-material";

import api from "../../api"; // Import de l'instance axios préconfigurée

// Couleurs Nationales RDC
const RDC_COLORS = {
  blue: "#007FFF", // Bleu drapeau
  yellow: "#F7D618", // Jaune drapeau
  red: "#CE1126", // Rouge drapeau
};

/* ---------------- COMPOSANT STAT CARD ---------------- */
const StatCard = ({ title, value, icon, customColor }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{
      backgroundColor: theme.palette.background.paper,
      p: 2.5, borderRadius: "16px", display: "flex",
      alignItems: "center", justifyContent: "space-between",
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
      transition: "transform 0.2s",
      "&:hover": { transform: "translateY(-4px)", boxShadow: `0 8px 24px ${alpha(customColor, 0.15)}` }
    }}>
      <Box>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 700, textTransform: "uppercase", fontSize: "0.65rem" }}>
          {title}
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5 }}>
          {value.toString().padStart(2, '0')}
        </Typography>
      </Box>
      <Box sx={{ 
        p: 2, borderRadius: "12px", 
        backgroundColor: alpha(customColor, 0.1), 
        color: customColor, display: "flex" 
      }}>
        {icon}
      </Box>
    </Box>
  );
};

/* ---------------- PAGE PRINCIPALE ---------------- */
const GestionPersonnel = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState({ total: 0, en_poste: 0, en_conge: 0, alertes: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);

  const [formData, setFormData] = useState({
    nom: "", postnom: "", prenom: "", matricule: "", nni: "",
    grade: "AGENT", affectation: "SECURITE"
  });

  // Récupération des données depuis Django
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resAgents, resStats] = await Promise.all([
        api.get("/agents/"),
        api.get("/agents/statistiques/") // Assure-toi que cette route existe
      ]);
      setAgents(resAgents.data);
      setStats(resStats.data);
      // Sélectionner le premier agent par défaut pour le badge
      if (resAgents.data.length > 0) setSelectedAgent(resAgents.data[0]);
    } catch (err) {
      console.error("Erreur backend", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Sauvegarder un nouvel agent
  const handleSave = async () => {
    try {
      await api.post("/agents/", formData);
      setOpen(false);
      fetchData(); // Rafraîchir la liste
    } catch (err) {
      alert("Erreur lors de l'enregistrement. Vérifiez les champs.");
    }
  };

  const columns = [
    {
      field: "agent",
      headerName: "Agent / Officier",
      flex: 1.5,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar src={params.row.photo} sx={{ width: 35, height: 35, bgcolor: RDC_COLORS.blue, fontWeight: 800 }}>
            {params.row.nom ? params.row.nom[0] : "?"}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={800}>{params.row.nom} {params.row.postnom}</Typography>
            <Typography variant="caption" color="text.secondary">{params.row.grade}</Typography>
          </Box>
        </Box>
      )
    },
    { field: "matricule", headerName: "ID", width: 120 },
    {
      field: "statut",
      headerName: "Présence",
      width: 130,
      renderCell: ({ value }) => (
        <Chip 
          label={value || "ACTIF"} 
          size="small" 
          sx={{ 
            fontWeight: 800, 
            backgroundColor: alpha(RDC_COLORS.blue, 0.1),
            color: RDC_COLORS.blue,
            border: "none"
          }} 
        />
      )
    },
    { field: "affectation", headerName: "Secteur", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton size="small" sx={{ color: RDC_COLORS.blue }} onClick={() => setSelectedAgent(params.row)}>
            <VisibilityOutlined fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: RDC_COLORS.yellow }}><EditOutlined fontSize="small" /></IconButton>
          <IconButton size="small" sx={{ color: RDC_COLORS.red }}><DeleteOutline fontSize="small" /></IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: theme.palette.background.default, minHeight: "100vh" }}>
      
      {/* HEADER SECTION */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-1px" }}>Personnel Pénitentiaire</Typography>
          <Typography variant="body2" color="text.secondary">Gestion RH, Biométrie et Administration des effectifs</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddModeratorOutlined />}
          onClick={() => setOpen(true)}
          sx={{ bgcolor: RDC_COLORS.blue, borderRadius: "10px", px: 3, fontWeight: 700, textTransform: "none", boxShadow: `0 4px 14px ${alpha(RDC_COLORS.blue, 0.4)}`, "&:hover": { bgcolor: "#005bb5" } }}
        >
          Nouvel Agent
        </Button>
      </Box>

      {/* STATS ROW */}
      <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }} gap={3} mb={4}>
        <StatCard title="Total Staff" value={stats.total} icon={<AssignmentIndOutlined />} customColor={RDC_COLORS.blue} />
        <StatCard title="En Service" value={stats.en_poste} icon={<VerifiedUserOutlined />} customColor="#2e7d32" />
        <StatCard title="En Congé" value={stats.en_conge} icon={<EventNoteOutlined />} customColor={RDC_COLORS.yellow} />
        <StatCard title="Alertes Pointage" value={stats.alertes} icon={<BadgeOutlined />} customColor={RDC_COLORS.red} />
      </Box>

      <Grid container spacing={3}>
        {/* TABLEAU DES AGENTS */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ 
            height: 500, backgroundColor: theme.palette.background.paper, 
            borderRadius: "20px", border: `1px solid ${theme.palette.divider}`, overflow: "hidden" 
          }}>
            <DataGrid
              rows={agents}
              columns={columns}
              loading={loading}
              localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
              disableRowSelectionOnClick
              sx={{ 
                border: "none",
                "& .MuiDataGrid-columnHeaders": { backgroundColor: alpha(RDC_COLORS.blue, 0.05) }
              }}
            />
          </Box>
        </Grid>

        {/* PRÉVISUALISATION CARTE PROFESSIONNELLE */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ p: 3, backgroundColor: theme.palette.background.paper, borderRadius: "20px", border: `1px solid ${theme.palette.divider}`, textAlign: 'center', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={800} mb={3}>Badge Professionnel (Preview)</Typography>
            
            {selectedAgent ? (
              <Card sx={{ 
                  maxWidth: 300, mx: "auto", borderRadius: "15px", 
                  border: `1px solid ${theme.palette.divider}`, overflow: 'hidden',
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
              }}>
                  {/* Header Badge - Couleurs RDC */}
                  <Box sx={{ bgcolor: RDC_COLORS.blue, color: "#fff", py: 1.5, position: 'relative' }}>
                      <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', bgcolor: RDC_COLORS.yellow }} />
                      <Box sx={{ position: 'absolute', bottom: -4, left: 0, width: '100%', height: '4px', bgcolor: RDC_COLORS.red }} />
                      <Typography variant="caption" fontWeight={900} sx={{ letterSpacing: 1 }}>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</Typography>
                      <br/>
                      <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.6rem' }}>MINISTÈRE DE LA JUSTICE ET GARDE DES SCEAUX</Typography>
                  </Box>

                  <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
                      <Avatar src={selectedAgent.photo} sx={{ width: 100, height: 100, mb: 2, border: `3px solid ${RDC_COLORS.blue}` }} />
                      <Typography variant="h6" fontWeight={900} color="text.primary">
                        {selectedAgent.nom.toUpperCase()} {selectedAgent.postnom?.toUpperCase()} {selectedAgent.prenom.toUpperCase()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: RDC_COLORS.red, fontWeight: 800 }}>
                        {selectedAgent.grade || "AGENT"}
                      </Typography>
                      
                      <Divider sx={{ width: '100%', my: 2 }} />
                      
                      <FingerprintOutlined sx={{ fontSize: 35, color: RDC_COLORS.blue, opacity: 0.8 }} />
                      <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ mt: 0.5 }}>SECURE BIOMETRIC ID</Typography>
                  </Box>

                  <Box bgcolor={theme.palette.mode === 'dark' ? "#111" : "#f5f5f5"} p={1.5} borderTop={`1px solid ${theme.palette.divider}`}>
                      <Typography variant="h6" color="text.primary" sx={{ letterSpacing: 3, fontFamily: 'monospace', fontWeight: 700 }}>
                        {selectedAgent.matricule}
                      </Typography>
                  </Box>
              </Card>
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="70%">
                <CircularProgress size={30} sx={{ color: RDC_COLORS.blue, mb: 2 }} />
                <Typography variant="body2" color="text.secondary">Sélectionnez un agent dans le tableau</Typography>
              </Box>
            )}

            <Button fullWidth variant="outlined" startIcon={<PrintOutlined />} disabled={!selectedAgent} sx={{ mt: 4, fontWeight: 800, borderRadius: "10px", color: RDC_COLORS.blue, borderColor: RDC_COLORS.blue }}>
                Imprimer le Badge
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* MODAL AJOUT PERSONNEL */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: RDC_COLORS.blue }}>Enrôlement Nouvel Agent</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} display="flex" justifyContent="center" mb={2}>
                <Box sx={{ width: 100, height: 100, borderRadius: "50%", border: `2px dashed ${RDC_COLORS.blue}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', bgcolor: alpha(RDC_COLORS.blue, 0.05) }}>
                    <PhotoCamera sx={{ color: RDC_COLORS.blue }} />
                    <IconButton size="small" sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: RDC_COLORS.blue, color: '#fff', '&:hover': { bgcolor: "#005bb5" } }}>
                        <AddModeratorOutlined fontSize="small" />
                    </IconButton>
                </Box>
            </Grid>
            <Grid item xs={4}><TextField fullWidth label="Nom" variant="filled" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Postnom" variant="filled" value={formData.postnom} onChange={e => setFormData({...formData, postnom: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Prénom" variant="filled" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} /></Grid>
            
            <Grid item xs={6}><TextField fullWidth label="Grade" variant="filled" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Matricule" variant="filled" value={formData.matricule} onChange={e => setFormData({...formData, matricule: e.target.value})} /></Grid>
            
            <Grid item xs={12}>
                <Typography variant="caption" fontWeight={800} gutterBottom display="block" color={RDC_COLORS.blue}>AUTHENTIFICATION BIOMÉTRIQUE REQUISE</Typography>
                <Button fullWidth variant="text" startIcon={<FingerprintOutlined />} sx={{ py: 2, border: `1px dashed ${RDC_COLORS.blue}`, color: RDC_COLORS.blue, bgcolor: alpha(RDC_COLORS.blue, 0.05) }}>
                    Scanner l'empreinte de l'agent
                </Button>
            </Grid>
            
            <Grid item xs={12}>
                <TextField select fullWidth label="Affectation Secteur" variant="filled" value={formData.affectation} onChange={e => setFormData({...formData, affectation: e.target.value})}>
                    <MenuItem value="SECURITE">Sécurité Intérieure</MenuItem>
                    <MenuItem value="ADMINISTRATION">Administration / Greffe</MenuItem>
                    <MenuItem value="MEDICAL">Unité Médicale</MenuItem>
                </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} color="inherit" sx={{ fontWeight: 700 }}>Annuler</Button>
          <Button onClick={handleSave} variant="contained" sx={{ fontWeight: 700, px: 4, bgcolor: RDC_COLORS.blue, "&:hover": { bgcolor: "#005bb5" } }}>Enregistrer l'Agent</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default GestionPersonnel;