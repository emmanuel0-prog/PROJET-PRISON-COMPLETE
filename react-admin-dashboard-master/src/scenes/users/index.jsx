import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Avatar,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  MenuItem,
  Select,
  Paper,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Divider,
  Grid,
} from "@mui/material";
import { DataGrid, frFR } from "@mui/x-data-grid";
import {
  PersonAddOutlined,
  DeleteOutline,
  EditOutlined,
  AdminPanelSettingsOutlined,
  Close,
  SecurityOutlined,
  BadgeOutlined,
} from "@mui/icons-material";
import { tokens } from "../../theme";
import { Header } from "../../components";
import api from "../../api";

// Générer un dégradé unique basé sur le nom
const stringToGradient = (string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c1 = `hsl(${hash % 360}, 70%, 60%)`;
  const c2 = `hsl(${(hash + 40) % 360}, 80%, 50%)`;
  return `linear-gradient(135deg, ${c1}, ${c2})`;
};

const initialFormState = {
  username: "",
  email: "",
  password: "",
  telephone: "",
  role: "AGENT",
  is_active: true,
  is_verified: false,
  two_factor_enabled: false,
};

const Users = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  // État de la modale
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  // ================= LOAD DATA =================
  const loadUsers = async () => {
    try {
      const res = await api.get(`/users/`);
      setRows(res.data);
    } catch (e) {
      console.error("Erreur chargement utilisateurs", e);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await api.get(`/users/permissions/all/`);
      setRoles(Object.keys(res.data));
    } catch (e) {
      console.error("Erreur chargement rôles", e);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([loadUsers(), loadRoles()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ================= MODAL HANDLERS =================
  const handleOpenCreate = () => {
    setFormData({ ...initialFormState, role: roles[0] || "AGENT" });
    setIsEditMode(false);
    setCurrentUserId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (userRow) => {
    setFormData({
      username: userRow.username || "",
      email: userRow.email || "",
      password: "", // On laisse vide par défaut, à remplir seulement si on veut changer
      telephone: userRow.telephone || "",
      role: userRow.role || "AGENT",
      is_active: userRow.is_active ?? true,
      is_verified: userRow.is_verified ?? false,
      two_factor_enabled: userRow.two_factor_enabled ?? false,
    });
    setCurrentUserId(userRow.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // ================= ACTIONS =================
  const handleSubmit = async () => {
    try {
      if (!formData.username) {
        alert("Le nom d'utilisateur est requis.");
        return;
      }

      // Nettoyer les données avant envoi (ne pas envoyer le mdp s'il est vide en édition)
      const dataToSend = { ...formData };
      if (isEditMode && !dataToSend.password) {
        delete dataToSend.password;
      }

      if (isEditMode) {
        await api.patch(`/users/${currentUserId}/`, dataToSend);
      } else {
        if (!dataToSend.password) {
          alert("Le mot de passe est requis pour un nouvel utilisateur.");
          return;
        }
        await api.post(`/users/create/`, dataToSend);
      }

      setIsModalOpen(false);
      loadUsers();
    } catch (e) {
      console.error("Erreur sauvegarde utilisateur", e);
      alert("Erreur lors de la sauvegarde. Vérifiez la console.");
    }
  };

  const handleRoleChangeDirect = async (id, newRole) => {
    try {
      await api.patch(`/users/${id}/`, { role: newRole });
      loadUsers();
    } catch (e) {
      console.error("Erreur mise à jour rôle", e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Alerte de Sécurité : Supprimer définitivement cet utilisateur ?")) return;

    try {
      await api.delete(`/users/${id}/`);
      loadUsers();
    } catch (e) {
      console.error("Erreur suppression", e);
    }
  };

  // ================= TABLE =================
  const columns = [
    {
      field: "username",
      headerName: "Identité",
      flex: 1.2,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              background: stringToGradient(row.username || "U"),
              boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.5)}`,
              fontWeight: "bold",
            }}
          >
            {row.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography fontWeight={700} sx={{ letterSpacing: "0.5px" }}>
              {row.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.email} {row.telephone ? `• ${row.telephone}` : ""}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: "role",
      headerName: "Niveau d'Accès",
      flex: 1,
      renderCell: ({ row }) => (
        <Select
          value={row.role || ""}
          onChange={(e) => handleRoleChangeDirect(row.id, e.target.value)}
          size="small"
          variant="outlined"
          sx={{
            minWidth: 150,
            fontWeight: 600,
            borderRadius: "8px",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha(theme.palette.primary.main, 0.3),
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          {roles.map((r) => (
            <MenuItem key={r} value={r}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AdminPanelSettingsOutlined fontSize="small" sx={{ opacity: 0.7 }} />
                <span>{r}</span>
              </Stack>
            </MenuItem>
          ))}
        </Select>
      ),
    },
    {
      field: "is_active",
      headerName: "Statut",
      flex: 0.8,
      renderCell: ({ row }) => {
        const isActive = row.is_active;
        const color = isActive ? theme.palette.success.main : theme.palette.error.main;

        return (
          <Stack spacing={0.5}>
            <Chip
              label={isActive ? "ACTIF" : "INACTIF"}
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: "0.7rem",
                bgcolor: alpha(color, 0.1),
                color: color,
                border: `1px solid ${alpha(color, 0.5)}`,
              }}
            />
            {row.two_factor_enabled && (
              <Typography variant="caption" sx={{ color: theme.palette.info.main, fontSize: "0.65rem", fontWeight: "bold" }}>
                🔒 2FA ACTIF
              </Typography>
            )}
          </Stack>
        );
      },
    },
    {
      field: "actions",
      headerName: "Protocoles",
      flex: 0.8,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Modifier le dossier" arrow>
            <IconButton
              onClick={() => handleOpenEdit(row)}
              sx={{
                color: theme.palette.info.main,
                "&:hover": { bgcolor: alpha(theme.palette.info.main, 0.1) },
              }}
            >
              <EditOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Révoquer l'accès" arrow>
            <IconButton
              onClick={() => handleDelete(row.id)}
              sx={{
                color: theme.palette.error.main,
                "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.1) },
              }}
            >
              <DeleteOutline />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Header
          title="UTILISATEURS SYSTÈME"
          subtitle="Gestion sécurisée des habilitations, rôles et audits"
        />
        <Button
          variant="contained"
          startIcon={<PersonAddOutlined />}
          onClick={handleOpenCreate}
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            fontWeight: "bold",
            padding: "10px 24px",
            borderRadius: "8px",
            boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`,
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.6)}`,
            },
          }}
        >
          NOUVEL AGENT
        </Button>
      </Stack>

      {/* Conteneur High-Tech Glassmorphism */}
      <Paper
        elevation={0}
        sx={{
          height: "70vh",
          width: "100%",
          background: alpha(theme.palette.background.paper, 0.4),
          backdropFilter: "blur(10px)",
          borderRadius: "16px",
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: "hidden",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        {loading && <LinearProgress color="secondary" />}

        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          pagination
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sx={{
            border: "none",
            "& .MuiDataGrid-cell": {
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
              display: "flex",
              alignItems: "center",
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: alpha(theme.palette.background.default, 0.6),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
            },
          }}
        />
      </Paper>

      {/* Modale High-Tech Façon Django Admin */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            background: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: "blur(20px)",
            borderRadius: "16px",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.background.default, 0.5)}`,
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Typography variant="h4" fontWeight="bold" color="secondary">
            {isEditMode ? "Modification du Profil Agent" : "Nouveau Profil Agent"}
          </Typography>
          <IconButton onClick={() => setIsModalOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={4}>
            
            {/* Section 1 : Informations Générales */}
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <BadgeOutlined color="primary" />
                <Typography variant="h6" fontWeight="bold">Informations Personnelles</Typography>
              </Stack>
              <Stack spacing={2.5}>
                <TextField
                  label="Identifiant Système *"
                  variant="outlined"
                  fullWidth
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
                <TextField
                  label="Adresse Email"
                  type="email"
                  variant="outlined"
                  fullWidth
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <TextField
                  label="Téléphone de Contact"
                  variant="outlined"
                  fullWidth
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                />
                <TextField
                  label={isEditMode ? "Nouveau Mot de Passe (laisser vide pour conserver)" : "Mot de passe *"}
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </Stack>
            </Grid>

            {/* Section 2 : Permissions & Sécurité (Style Django Admin) */}
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <SecurityOutlined color="secondary" />
                <Typography variant="h6" fontWeight="bold">Sécurité & Habilitations</Typography>
              </Stack>
              
              <Box p={2} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, borderRadius: "8px", mb: 3 }}>
                <Typography variant="subtitle2" mb={1} color="text.secondary">Niveau de Rôle Système</Typography>
                <Select
                  value={formData.role || ""}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  fullWidth
                  displayEmpty
                >
                  {roles.length === 0 && <MenuItem value="" disabled>Chargement des rôles...</MenuItem>}
                  {roles.map((r) => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </Select>
              </Box>

              <Box p={2} sx={{ background: alpha(theme.palette.background.default, 0.5), borderRadius: "8px" }}>
                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={formData.is_active} 
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} 
                        color="success" 
                      />
                    }
                    label={<Typography fontWeight="bold">Compte Actif (Autoriser la connexion)</Typography>}
                  />
                  <Divider />
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={formData.is_verified} 
                        onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })} 
                        color="info" 
                      />
                    }
                    label="Profil Vérifié (KYC / Biométrie validée)"
                  />
                  <Divider />
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={formData.two_factor_enabled} 
                        onChange={(e) => setFormData({ ...formData, two_factor_enabled: e.target.checked })} 
                        color="secondary" 
                      />
                    }
                    label="Exiger Authentification 2FA (OTP)"
                  />
                </Stack>
              </Box>
            </Grid>

          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Button 
            onClick={() => setIsModalOpen(false)} 
            sx={{ color: theme.palette.text.secondary, fontWeight: "bold" }}
          >
            ANNULER
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
              fontWeight: "bold",
              px: 4,
              borderRadius: "8px",
              boxShadow: `0 4px 10px ${alpha(theme.palette.secondary.main, 0.4)}`
            }}
          >
            {isEditMode ? "METTRE À JOUR" : "VALIDER L'AGENT"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;