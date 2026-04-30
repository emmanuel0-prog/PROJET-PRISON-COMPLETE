import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, Avatar, useTheme, alpha, Grid,
  TextField, MenuItem, Stack, Paper, CircularProgress, 
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import { DataGrid, frFR, GridToolbarQuickFilter } from "@mui/x-data-grid";
import {
  GavelOutlined, WarningOutlined, AccountBalanceOutlined,
  Edit, Delete, PersonOffOutlined, Save, Close
} from "@mui/icons-material";

// --- IMAGES ---
import sceauRdc from "../../assets/gouvernement rdc.png"; 
import api from "../../api"; // ✅ API CENTRALISÉE

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell
} from "recharts";

// --- CONFIGURATION DES COULEURS ---
const DNC_BLUE = "#007FFF";
const DNC_YELLOW = "#F7D618";
const DNC_RED = "#CE1021";
const DNC_BG = "#050B14";

// --- ANIMATIONS ---
const pulse = keyframes`
  0% { filter: drop-shadow(0 0 2px ${alpha(DNC_BLUE, 0.4)}); }
  50% { filter: drop-shadow(0 0 10px ${alpha(DNC_BLUE, 0.8)}); }
  100% { filter: drop-shadow(0 0 2px ${alpha(DNC_BLUE, 0.4)}); }
`;

const StyledPaper = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? "rgba(17, 34, 64, 0.6)" : "rgba(255, 255, 255, 0.9)",
  backdropFilter: "blur(12px)",
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: "16px",
  padding: theme.spacing(3),
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    border: `1px solid ${theme.palette.primary.main}`,
    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
}));

const StatCard = ({ label, value, icon, color }) => (
  <StyledPaper sx={{ borderLeft: `4px solid ${color}` }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Box>
        <Typography variant="overline" sx={{ opacity: 0.7, fontWeight: 800 }}>{label}</Typography>
        <Typography variant="h4" fontWeight={900} sx={{ color: color }}>{value}</Typography>
      </Box>
      <Avatar sx={{ bgcolor: alpha(color, 0.1), color: color, width: 45, height: 45 }}>
        {icon}
      </Avatar>
    </Stack>
  </StyledPaper>
);

const DossiersJudiciaires = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // --- ÉTATS ---
  const [rawData, setRawData] = useState([]);
  const [tribunaux, setTribunaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTribunal, setFilterTribunal] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");

  const [openModal, setOpenModal] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [editForm, setEditForm] = useState({});

  // --- CHARGEMENT DES DONNÉES ---
const fetchData = async () => {
  setLoading(true);
  try {
    const [resDet, resTrib] = await Promise.all([
      api.get("/detenus/"),
      api.get("/tribunaux/")
    ]);

    setRawData(resDet.data);
    setTribunaux(resTrib.data);

  } catch (e) {
    console.error("Erreur API:", e);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
  }, []);

  // --- LOGIQUE FILTRAGE & STATS ---
  const { filteredRows, statsGlobales, statsChart } = useMemo(() => {
    let counts = { PREVENU: 0, DETENU_PREVENTIF: 0, CONDAMNE: 0, CONDAMNE_PREVENTIF: 0, LIBERE: 0, MORT: 0 };
    let inculpationsMap = {};

    const filtered = rawData.filter(d => {
      const matchTribunal = filterTribunal === "all" || d.prison === parseInt(filterTribunal);
      const matchStatut = filterStatut === "all" || d.statut_juridique === filterStatut;
      
      if (matchTribunal && matchStatut) {
        if (counts[d.statut_juridique] !== undefined) counts[d.statut_juridique]++;
        const chef = d.dossier_judiciaire?.chef_inculpation || "Non défini";
        inculpationsMap[chef] = (inculpationsMap[chef] || 0) + 1;
      }
      return matchTribunal && matchStatut;
    }).map(d => ({
      ...d,
      id: d.id,
      detenu_nom: d.nom_complet,
      numero_rmp: d.dossier_judiciaire?.numero_rmp || "ATTENTE-RMP",
      chef_inculpation: d.dossier_judiciaire?.chef_inculpation || "Non défini",
      magistrat: d.dossier_judiciaire?.magistrat_instructeur || "NON ASSIGNÉ",
      statut: d.statut_juridique,
      dossier_id: d.dossier_judiciaire?.id // ID réel du dossier pour suppression/update
    }));

    const chartDataFormatted = Object.keys(inculpationsMap).map(key => ({
      name: key,
      val: inculpationsMap[key]
    })).sort((a, b) => b.val - a.val).slice(0, 5);

    return { filteredRows: filtered, statsGlobales: counts, statsChart: chartDataFormatted };
  }, [rawData, filterTribunal, filterStatut]);

  // --- ACTIONS ---
  const handleOpenEdit = (detenu) => {
    const dossier = detenu.dossier_judiciaire || {};
    setSelectedDossier(detenu);
    setEditForm({
      id: dossier.id,
      numero_rmp: dossier.numero_rmp || "",
      numero_rp: dossier.numero_rp || "",
      chef_inculpation: dossier.chef_inculpation || "",
      magistrat_instructeur: dossier.magistrat_instructeur || "",
      peine_prononcee: dossier.peine_prononcee || "",
      date_faits: dossier.date_faits || "",
      date_expiration_peine: dossier.date_expiration_peine || ""
    });
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (!editForm.id) return;
    try {
      const response = await api.patch(`/dossiers-judiciaires/${editForm.id}/`, editForm);
      if (response.ok) {
        setOpenModal(false);
        fetchData();
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (dossierId, nomDetenu) => {
    if (!dossierId) {
      alert("Ce détenu n'a pas encore de dossier judiciaire créé.");
      return;
    }

    const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le dossier judiciaire de ${nomDetenu} ? Cette action est irréversible.`);
    
    if (confirmDelete) {
      try {
        const response = await api.delete(`/dossiers-judiciaires/${dossierId}/`);
        if (response.ok) {
          fetchData(); // Rafraîchir tout (tableau + stats)
        } else {
          alert("Erreur lors de la suppression du dossier.");
        }
      } catch (e) {
        console.error("Erreur suppression:", e);
      }
    }
  };

  const columns = [
    {
      field: "detenu_nom",
      headerName: "CIBLE / DÉTENU",
      flex: 1.5,
      renderCell: (params) => (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ height: '100%' }}>
          <Avatar src={params.row.photo} sx={{ width: 32, height: 32, border: `1px solid ${DNC_BLUE}` }}>
            {params.value?.charAt(0)}
          </Avatar>
          <Typography variant="body2" fontWeight={700}>{params.value}</Typography>
        </Stack>
      ),
    },
    { field: "numero_rmp", headerName: "N° RMP", flex: 1, renderCell: (p) => <Typography sx={{ color: DNC_YELLOW, fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.value}</Typography> },
    { field: "chef_inculpation", headerName: "INFRACTION", flex: 1.2 },
    {
      field: "statut",
      headerName: "STATUT",
      flex: 1.2,
      renderCell: ({ value }) => {
        const config = {
          'CONDAMNE': { color: '#10b981', label: 'Condamné' },
          'DETENU_PREVENTIF': { color: DNC_YELLOW, label: 'Détention Prév.' },
          'PREVENU': { color: DNC_BLUE, label: 'Prévenu' },
          'MORT': { color: '#7f8c8d', label: 'Décédé' },
          'LIBERE': { color: DNC_RED, label: 'Libéré' },
        };
        const s = config[value] || { color: 'gray', label: value };
        return (
          <Box sx={{ px: 1, py: 0.3, borderRadius: 1, bgcolor: alpha(s.color, 0.1), color: s.color, border: `1px solid ${alpha(s.color, 0.4)}`, fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' }}>
            {s.label}
          </Box>
        );
      }
    },
    {
      field: "actions",
      headerName: "ACTIONS",
      width: 100,
      renderCell: (params) => (
        <Stack direction="row" spacing={0}>
          <IconButton size="small" sx={{ color: DNC_BLUE }} onClick={() => handleOpenEdit(params.row)}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            sx={{ color: DNC_RED }} 
            onClick={() => handleDelete(params.row.dossier_id, params.row.detenu_nom)}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Stack>
      )
    }
  ];

  return (
    <Box sx={{ 
      bgcolor: isDark ? DNC_BG : "#f4f7f9", 
      minHeight: "100vh", p: { xs: 2, md: 4 },
      transition: "background 0.3s ease", position: 'relative'
    }}>
      {/* HEADER */}
      <Stack direction="row" spacing={2} alignItems="center" mb={4}>
        <Box component="img" src={sceauRdc} sx={{ height: 50, animation: `${pulse} 3s infinite` }} />
        <Box>
          <Typography variant="h5" fontWeight={900}>REGISTRE <span style={{ color: DNC_BLUE }}>RMP</span></Typography>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>GESTIONNAIRE DES DOSSIERS JUDICIAIRES</Typography>
        </Box>
      </Stack>

      {/* STATS CARDS */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={3}><StatCard label="Prévenus" value={statsGlobales.PREVENU} icon={<AccountBalanceOutlined />} color={DNC_BLUE} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard label="Condamnés" value={statsGlobales.CONDAMNE} icon={<GavelOutlined />} color="#10b981" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard label="Détentions" value={statsGlobales.DETENU_PREVENTIF} icon={<WarningOutlined />} color={DNC_YELLOW} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard label="Décès" value={statsGlobales.MORT} icon={<PersonOffOutlined />} color="#7f8c8d" /></Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* GRAPHIQUE */}
        <Grid item xs={12} md={7}>
          <StyledPaper sx={{ height: 400, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800} mb={2} color="primary">TOP INFRACTIONS (STATS RÉELLES)</Typography>
            <Box sx={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsChart} layout="vertical" margin={{ left: 30, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={alpha(DNC_BLUE, 0.1)} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                  <Bar dataKey="val" radius={[0, 4, 4, 0]} barSize={20}>
                    {statsChart.map((entry, index) => <Cell key={index} fill={index % 2 === 0 ? DNC_BLUE : DNC_YELLOW} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </StyledPaper>
        </Grid>

        {/* FILTRES */}
        <Grid item xs={12} md={5}>
          <StyledPaper sx={{ height: 400 }}>
            <Typography variant="h6" fontWeight={800} mb={3} sx={{ color: DNC_YELLOW }}>PARAMÈTRES DE VUE</Typography>
            <Stack spacing={2}>
              <TextField select fullWidth label="Juridiction / Tribunal" value={filterTribunal} onChange={(e) => setFilterTribunal(e.target.value)}>
                <MenuItem value="all">Toutes les juridictions</MenuItem>
                {tribunaux.map(t => <MenuItem key={t.id} value={t.id}>{t.nom}</MenuItem>)}
              </TextField>
              <TextField select fullWidth label="Statut Juridique" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
                <MenuItem value="all">Tous les statuts</MenuItem>
                <MenuItem value="PREVENU">Prévenu</MenuItem>
                <MenuItem value="DETENU_PREVENTIF">Détenu Préventif</MenuItem>
                <MenuItem value="CONDAMNE">Condamné</MenuItem>
                <MenuItem value="MORT">Mort en détention</MenuItem>
              </TextField>
            </Stack>
          </StyledPaper>
        </Grid>

        {/* TABLEAU DATA */}
        <Grid item xs={12}>
          <StyledPaper sx={{ p: 0 }}>
            <Box sx={{ height: 500, width: '100%' }}>
              <DataGrid
                rows={filteredRows}
                columns={columns}
                loading={loading}
                localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                slots={{ toolbar: GridToolbarQuickFilter }}
                slotProps={{ toolbar: { showQuickFilter: true } }}
                sx={{ border: 'none', "& .MuiDataGrid-columnHeaders": { bgcolor: alpha(DNC_BLUE, 0.05) } }}
              />
            </Box>
          </StyledPaper>
        </Grid>
      </Grid>

      {/* --- MODALE DE MODIFICATION --- */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: isDark ? "#0a1929" : "#fff",
            border: `1px solid ${DNC_BLUE}`,
            borderRadius: "12px",
            boxShadow: `0 0 20px ${alpha(DNC_BLUE, 0.3)}`
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${alpha(DNC_BLUE, 0.2)}`, mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Edit sx={{ color: DNC_BLUE }} />
            <Typography variant="h6" fontWeight={800}>MODIFICATION DOSSIER : {selectedDossier?.nom_complet}</Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}><TextField fullWidth label="Numéro R.M.P" value={editForm.numero_rmp} onChange={(e) => setEditForm({...editForm, numero_rmp: e.target.value})}/></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Numéro R.P" value={editForm.numero_rp} onChange={(e) => setEditForm({...editForm, numero_rp: e.target.value})}/></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Magistrat Instructeur" value={editForm.magistrat_instructeur} onChange={(e) => setEditForm({...editForm, magistrat_instructeur: e.target.value})}/></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Peine Prononcée" value={editForm.peine_prononcee} onChange={(e) => setEditForm({...editForm, peine_prononcee: e.target.value})}/></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Chef d'inculpation" value={editForm.chef_inculpation} onChange={(e) => setEditForm({...editForm, chef_inculpation: e.target.value})}/></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth type="date" label="Date des faits" InputLabelProps={{ shrink: true }} value={editForm.date_faits} onChange={(e) => setEditForm({...editForm, date_faits: e.target.value})}/></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth type="date" label="Expiration de peine" InputLabelProps={{ shrink: true }} value={editForm.date_expiration_peine} onChange={(e) => setEditForm({...editForm, date_expiration_peine: e.target.value})}/></Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: `1px solid ${alpha(DNC_BLUE, 0.1)}` }}>
          <Button onClick={() => setOpenModal(false)} startIcon={<Close />} sx={{ color: "gray" }}>Annuler</Button>
          <Button onClick={handleSave} variant="contained" startIcon={<Save />} sx={{ bgcolor: DNC_BLUE, "&:hover": { bgcolor: alpha(DNC_BLUE, 0.8) } }}>
            Mettre à jour
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DossiersJudiciaires;