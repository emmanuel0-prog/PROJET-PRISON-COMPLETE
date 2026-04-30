import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  useTheme,
  alpha,
  Paper,
  LinearProgress,
  Stack,
  Switch,
  Divider,
  Grid,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import {
  SecurityOutlined,
  AdminPanelSettingsOutlined,
  VpnKeyOutlined,
  ShieldOutlined,
  GavelOutlined,
  LocalHospitalOutlined,
  InventoryOutlined,
  BadgeOutlined,
} from "@mui/icons-material";
import { tokens } from "../../../theme";
import { Header } from "../../../components";
import api from "../../../api";

// Mapping des rôles (correspondant à tes ROLE_CHOICES Django)
const ROLE_MAPPING = [
  { code: "ADMIN", label: "Administrateur Système", icon: <AdminPanelSettingsOutlined /> },
  { code: "MINISTRE", label: "Ministre de la Justice", icon: <GavelOutlined /> },
  { code: "DIRECTEUR", label: "Directeur de Prison", icon: <SecurityOutlined /> },
  { code: "GREFFIER", label: "Greffier De la Justice", icon: <BadgeOutlined /> },
  { code: "MEDECIN", label: "Service Médical", icon: <LocalHospitalOutlined /> },
  { code: "INTENDANT", label: "Logistique & Intendance", icon: <InventoryOutlined /> },
  { code: "SECURITE", label: "Chef de Sécurité", icon: <ShieldOutlined /> },
  { code: "AGENT", label: "Agent de Détention", icon: <VpnKeyOutlined /> },
];

const Permissions = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState("ADMIN");
  
  // Toutes les permissions existantes (depuis la table Permission)
  const [allPermissions, setAllPermissions] = useState([]);
  
  // Dictionnaire des permissions par rôle : { "ADMIN": ["edit_medical", ...], "MEDECIN": [...] }
  const [rolePermissions, setRolePermissions] = useState({});

  // ================= LOAD DATA =================
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Récupérer toutes les permissions disponibles
      const permsRes = await api.get(`/users/permissions/`); // Ton endpoint get_permissions
      setAllPermissions(permsRes.data);

      // 2. Récupérer l'état actuel des accès pour tous les rôles
      const rolesRes = await api.get(`/users/permissions/all/`); // Ton endpoint all_roles_permissions
      setRolePermissions(rolesRes.data);
    } catch (e) {
      console.error("Erreur de chargement des permissions", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= ACTIONS =================
  const handleTogglePermission = async (permCode, isCurrentlyAssigned) => {
    // Optimistic UI update (on met à jour l'interface instantanément pour la fluidité)
    const updatedRolePerms = { ...rolePermissions };
    if (isCurrentlyAssigned) {
      updatedRolePerms[activeRole] = updatedRolePerms[activeRole].filter(code => code !== permCode);
    } else {
      updatedRolePerms[activeRole] = [...(updatedRolePerms[activeRole] || []), permCode];
    }
    setRolePermissions(updatedRolePerms);

    // Requête vers le backend
    try {
      if (isCurrentlyAssigned) {
        await api.post(`/users/permissions/remove/`, {
          role: activeRole,
          permission_code: permCode,
        });
      } else {
        await api.post(`/users/permissions/assign/`, {
          role: activeRole,
          permission_code: permCode,
        });
      }
    } catch (e) {
      console.error("Erreur lors de la modification de la permission", e);
      // En cas d'erreur, on recharge les vraies données
      fetchData(); 
    }
  };

  const handleRoleTabChange = (event, newValue) => {
    setActiveRole(newValue);
  };

  // ================= GROUPER LES PERMISSIONS =================
  // Organise l'affichage par catégorie (ex: MEDICAL, SECURITE, GENERAL)
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});

  return (
    <Box m="20px">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Header
          title="MATRICE DES HABILITATIONS"
          subtitle="Contrôle granulaire des accès système par niveau de rôle"
        />
      </Stack>

      <Paper
        elevation={0}
        sx={{
          height: "75vh",
          display: "flex",
          background: alpha(theme.palette.background.paper, 0.4),
          backdropFilter: "blur(10px)",
          borderRadius: "16px",
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: "hidden",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Barre Latérale : Sélection des Rôles */}
        <Box
          sx={{
            width: "300px",
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.background.default, 0.6),
            overflowY: "auto",
          }}
        >
          <Tabs
            orientation="vertical"
            variant="scrollable"
            value={activeRole}
            onChange={handleRoleTabChange}
            sx={{
              "& .MuiTab-root": {
                alignItems: "flex-start",
                textAlign: "left",
                padding: "20px",
                textTransform: "none",
                fontSize: "0.95rem",
                fontWeight: "bold",
                minHeight: "70px",
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                transition: "all 0.2s ease",
              },
              "& .Mui-selected": {
                background: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.secondary.main,
              },
              "& .MuiTabs-indicator": {
                width: "4px",
                background: `linear-gradient(to bottom, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                borderRadius: "4px",
              },
            }}
          >
            {ROLE_MAPPING.map((role) => (
              <Tab
                key={role.code}
                value={role.code}
                label={
                  <Stack direction="row" spacing={2} alignItems="center">
                    {role.icon}
                    <Box>
                      <Typography fontWeight="800" sx={{ letterSpacing: "0.5px" }}>{role.code}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight="normal">
                        {role.label}
                      </Typography>
                    </Box>
                  </Stack>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* Zone Principale : Grille des Permissions */}
        <Box sx={{ flex: 1, p: 4, overflowY: "auto" }}>
          {loading ? (
            <LinearProgress color="secondary" />
          ) : (
            <Box>
              <Typography variant="h4" fontWeight="bold" color="secondary" mb={1}>
                Protocoles d'accès : {activeRole}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" mb={4}>
                Activez ou désactivez les permissions pour le groupe {ROLE_MAPPING.find(r => r.code === activeRole)?.label}.
              </Typography>

              {Object.keys(groupedPermissions).map((category) => (
                <Box key={category} mb={4}>
                  <Divider sx={{ mb: 3 }}>
                    <Chip 
                      label={category} 
                      color="primary" 
                      variant="outlined" 
                      sx={{ fontWeight: "bold", letterSpacing: "1px" }} 
                    />
                  </Divider>
                  
                  <Grid container spacing={3}>
                    {groupedPermissions[category].map((perm) => {
                      // Vérifie si ce rôle possède cette permission actuellement
                      const isAssigned = rolePermissions[activeRole]?.includes(perm.code);

                      return (
                        <Grid item xs={12} md={6} lg={4} key={perm.code}>
                          <Card
                            elevation={0}
                            sx={{
                              background: alpha(theme.palette.background.default, 0.4),
                              border: `1px solid ${isAssigned ? alpha(theme.palette.secondary.main, 0.5) : alpha(theme.palette.divider, 0.1)}`,
                              borderRadius: "12px",
                              transition: "all 0.3s ease",
                              boxShadow: isAssigned ? `0 0 15px ${alpha(theme.palette.secondary.main, 0.1)}` : "none",
                              "&:hover": {
                                background: alpha(theme.palette.background.default, 0.8),
                              }
                            }}
                          >
                            <CardContent sx={{ p: "16px !important", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Box sx={{ pr: 2 }}>
                                <Typography fontWeight="bold" fontSize="0.95rem">
                                  {perm.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  {perm.description || `Code: ${perm.code}`}
                                </Typography>
                              </Box>
                              
                              <Switch
                                color="secondary"
                                checked={isAssigned}
                                onChange={() => handleTogglePermission(perm.code, isAssigned)}
                              />
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              ))}

              {allPermissions.length === 0 && (
                <Typography color="text.secondary" align="center" mt={10}>
                  Aucune permission trouvée dans le système. Veuillez vérifier l'initialisation de la base de données.
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Permissions;