import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Avatar,
} from "@mui/material";
import { DataGrid, frFR } from "@mui/x-data-grid";
import {
  PeopleAltOutlined,
  ExitToAppOutlined,
  CompareArrowsOutlined,
  WarningOutlined,
  FingerprintOutlined,
  AddOutlined,
  PhotoCamera,
  EditOutlined,
  DeleteOutlined,
} from "@mui/icons-material";

// Importation de l'instance API configurée avec Axios
import API from "../../api";

/* ---------------- COMPOSANTS RÉUTILISABLES ---------------- */

const StatCard = ({ title, value, icon, trend, colorType }) => {
  const theme = useTheme();
  const mainColor = theme.palette[colorType]?.main || theme.palette.primary.main;

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        p: 2.5,
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.palette.mode === "dark" ? "none" : theme.shadows[1],
      }}
    >
      <Box>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
          {title}
        </Typography>
        <Box display="flex" alignItems="baseline" gap={1} mt={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
            {value}
          </Typography>
          {trend && (
            <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: "bold" }}>
              {trend}
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ p: 1.5, borderRadius: "10px", backgroundColor: alpha(mainColor, 0.12), color: mainColor, display: "flex" }}>
        {icon}
      </Box>
    </Box>
  );
};

const BarChartItem = ({ label, colorType, percent }) => {
  const theme = useTheme();
  const mainColor = theme.palette[colorType]?.main || theme.palette.primary.main;

  return (
    <Box sx={{ textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Box sx={{ height: "150px", width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", mb: 1 }}>
        <Box
          sx={{
            width: "35px",
            height: `${percent}%`,
            backgroundColor: mainColor,
            borderRadius: "4px 4px 0 0",
            transition: "height 1s ease-in-out",
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
  );
};

/* ---------------- PAGE PRINCIPALE ---------------- */
const SNGD_Dashboard = () => {
  const theme = useTheme();

  // --- ÉTATS ---
  const [rows, setRows] = useState([]);
  const [prisons, setPrisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ pageSize: 10, page: 0 });

  // États pour le Modal et la logique CRUD
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [photo, setPhoto] = useState(null);
  
  const [form, setForm] = useState({
    matricule: "",
    nom: "",
    postnom: "",
    prenom: "",
    sexe: "M",
    date_naissance: "",
    prison: "",
    statut_juridique: "PREVENU",
  });

  // --- LOGIQUE API ---

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resDetenus, resPrisons] = await Promise.all([
        API.get("core/detenus/"),
        API.get("core/prisons/"),
      ]);
      setRows(resDetenus.data);
      setPrisons(resPrisons.data);
    } catch (err) {
      console.error("Erreur lors du chargement des données :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Fonction pour ouvrir le modal en mode "Ajout"
  const handleOpenAdd = () => {
    setEditMode(false);
    setSelectedId(null);
    setPhoto(null);
    setForm({
      matricule: "", nom: "", postnom: "", prenom: "",
      sexe: "M", date_naissance: "", prison: "", statut_juridique: "PREVENU",
    });
    setOpen(true);
  };

  // Fonction pour ouvrir le modal en mode "Edition"
  const handleEdit = (row) => {
    setForm({
      matricule: row.matricule,
      nom: row.nom,
      postnom: row.postnom,
      prenom: row.prenom,
      sexe: row.sexe,
      date_naissance: row.date_naissance,
      prison: row.prison, // ID de la prison
      statut_juridique: row.statut_juridique,
    });
    setSelectedId(row.id);
    setEditMode(true);
    setOpen(true);
  };

  // Fonction de suppression
  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce dossier ?")) return;
    try {
      await API.delete(`core/detenus/${id}/`);
      fetchData();
    } catch (err) {
      alert("Erreur lors de la suppression du dossier.");
    }
  };

  // Fonction de soumission unique (Ajout ou Update)
  const handleSubmit = async () => {
    const formData = new FormData();
    Object.keys(form).forEach((key) => {
        if (form[key]) formData.append(key, form[key]);
    });
    if (photo) formData.append("photo", photo);

    try {
      if (editMode) {
        await API.put(`core/detenus/${selectedId}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await API.post("core/detenus/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      
      setOpen(false);
      setPhoto(null);
      fetchData();
    } catch (err) {
      console.error("Erreur API :", err.response?.data);
      alert("Erreur lors de l'enregistrement des données.");
    }
  };

  // --- COLONNES DU TABLEAU ---
  const columns = [
    { 
      field: "photo", 
      headerName: "Photo", 
      width: 60,
      renderCell: (params) => (
        <Avatar src={params.value} sx={{ width: 32, height: 32, border: `1px solid ${theme.palette.divider}` }} />
      )
    },
    { field: "matricule", headerName: "Matricule", width: 120 },
    { field: "nom", headerName: "Nom", flex: 1 },
    { field: "prenom", headerName: "Prénom", flex: 1 },
    {
      field: "statut_juridique",
      headerName: "Statut",
      width: 130,
      renderCell: ({ value }) => {
        let color = theme.palette.warning.main;
        if (value === "CONDAMNE") color = theme.palette.error.main;
        if (value === "LIBERE") color = theme.palette.success.main;
        return <Typography sx={{ color, fontWeight: 700, fontSize: "0.75rem" }}>{value}</Typography>;
      },
    },
    { field: "prison_nom", headerName: "Établissement", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 110,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" color="primary" onClick={() => handleEdit(params.row)}>
            <EditOutlined fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: theme.palette.background.default, minHeight: "100vh" }}>
      
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Gestion des Détenus</Typography>
          <Typography variant="body2" color="text.secondary">SNGD – République Démocratique du Congo</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={handleOpenAdd}
          sx={{ borderRadius: "10px", px: 3, fontWeight: 600 }}
        >
          Nouveau Détenu
        </Button>
      </Box>

      {/* STATS */}
      <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }} gap={3} mb={4}>
        <StatCard title="Total Détenus" value={rows.length} icon={<PeopleAltOutlined />} colorType="primary" />
        <StatCard title="Libérés" value="58" icon={<ExitToAppOutlined />} colorType="success" />
        <StatCard title="En Transfert" value="14" icon={<CompareArrowsOutlined />} colorType="warning" />
        <StatCard title="Alertes" value="3" icon={<WarningOutlined />} colorType="error" />
      </Box>

      {/* TABLEAU */}
      <Box sx={{ height: 500, backgroundColor: theme.palette.background.paper, borderRadius: "16px", border: `1px solid ${theme.palette.divider}`, overflow: "hidden" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25]}
          disableRowSelectionOnClick
        />
      </Box>

      {/* MODAL AJOUT / MODIFICATION */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editMode ? "Modifier le dossier" : "Enregistrer un nouveau détenu"}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} display="flex" flexDirection="column" alignItems="center" mb={2}>
              <Avatar 
                src={photo ? URL.createObjectURL(photo) : (editMode ? form.photo : "")} 
                sx={{ width: 80, height: 80, mb: 1, border: `2px dashed ${theme.palette.divider}` }}
              />
              <Button variant="outlined" component="label" startIcon={<PhotoCamera />} size="small">
                {editMode ? "Changer la photo" : "Uploader la photo"}
                <input type="file" hidden accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
              </Button>
            </Grid>

            <Grid item xs={12}><TextField fullWidth label="Matricule" name="matricule" value={form.matricule} onChange={handleChange} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Nom" name="nom" value={form.nom} onChange={handleChange} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Postnom" name="postnom" value={form.postnom} onChange={handleChange} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Prénom" name="prenom" value={form.prenom} onChange={handleChange} /></Grid>
            
            <Grid item xs={6}>
              <TextField select fullWidth label="Sexe" name="sexe" value={form.sexe} onChange={handleChange}>
                <MenuItem value="M">Masculin</MenuItem>
                <MenuItem value="F">Féminin</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField type="date" fullWidth label="Date de naissance" name="date_naissance" InputLabelProps={{ shrink: true }} value={form.date_naissance} onChange={handleChange} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField select fullWidth label="Établissement" name="prison" value={form.prison} onChange={handleChange}>
                {prisons.map((p) => <MenuItem key={p.id} value={p.id}>{p.nom}</MenuItem>)}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField select fullWidth label="Statut juridique" name="statut_juridique" value={form.statut_juridique} onChange={handleChange}>
                <MenuItem value="PREVENU">Prévenu</MenuItem>
                <MenuItem value="CONDAMNE">Condamné</MenuItem>
                <MenuItem value="LIBERE">Libéré</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Annuler</Button>
          <Button variant="contained" onClick={handleSubmit} sx={{ fontWeight: 700, px: 4 }}>
            {editMode ? "Mettre à jour" : "Enregistrer le dossier"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* BIOMÉTRIE FOOTER */}
      <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={3} mt={4}>
        <Box sx={{ p: 3, backgroundColor: theme.palette.background.paper, borderRadius: "16px", border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" fontWeight={700}>Statistiques Occupation</Typography>
          <Box display="flex" justifyContent="space-around" alignItems="flex-end" height="150px" mt={2}>
            <BarChartItem label="Makala" percent={85} colorType="error" />
            <BarChartItem label="Ndolo" percent={45} colorType="success" />
            <BarChartItem label="Beni" percent={60} colorType="warning" />
          </Box>
        </Box>
        <Box sx={{ p: 3, backgroundColor: theme.palette.background.paper, borderRadius: "16px", border: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <FingerprintOutlined sx={{ fontSize: 60, color: theme.palette.divider, mb: 1 }} />
            <Typography variant="subtitle2" fontWeight={600}>Scanner biométrique</Typography>
            <Button size="small" variant="outlined" sx={{ mt: 2 }}>Lancer Scan Empreinte</Button>
        </Box>
      </Box>
    </Box>
  );
};

export default SNGD_Dashboard;