/* eslint-disable react/prop-types */
import { Avatar, Box, IconButton, Typography, useTheme, Tooltip } from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { tokens } from "../../../theme";
import { Menu, MenuItem, Sidebar } from "react-pro-sidebar";
import {
  BarChartOutlined, CalendarTodayOutlined, ContactsOutlined, DashboardOutlined,
  DonutLargeOutlined, HelpOutlineOutlined, MapOutlined, MenuOutlined,
  PeopleAltOutlined, PersonOutlined, ReceiptOutlined, TimelineOutlined,
  WavesOutlined, CheckCircleOutline, DeleteOutlineOutlined, WarningAmber,
  InsightsOutlined, DescriptionOutlined, ExitToAppOutlined, SettingsOutlined, 
  BuildOutlined, PublicOutlined, LocationCityOutlined, AccountBalanceOutlined,
  ApartmentOutlined, MeetingRoomOutlined, PeopleOutlined, GavelOutlined, 
  SwapHorizOutlined, DirectionsWalkOutlined, EventBusyOutlined, BadgeOutlined, 
  ListAltOutlined, LocalHospitalOutlined, MedicationOutlined, StorefrontOutlined, 
  ShoppingCartOutlined, InventoryOutlined, SecurityOutlined, EventNoteOutlined, 
  ConstructionOutlined, RestaurantOutlined, AccountBalance, Gavel, VerifiedUser, MedicalServicesOutlined
} from "@mui/icons-material";
import avatar from "../../../assets/images/avatar.png";
import logo from "../../../assets/images/logo.png";
import Item from "./Item";
import { ToggledContext } from "../../../App";




const handleLogout = () => {
  localStorage.clear(); // supprime token + user
  window.location.href = "/login"; // redirection propre hors React
};

const SideBar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { toggled, setToggled } = useContext(ToggledContext);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // --- LOGIQUE DE SESSION & PERMISSIONS ---
  const [userData, setUserData] = useState({ username: "Déconnecté", role: "Inconnu", permissions: [], is_superuser: false });

  useEffect(() => {
    // Récupération des données utilisateur stockées lors du login
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  // Fonction clé : Vérifie si l'utilisateur a le droit de voir un menu
  const hasAccess = (allowedRoles = [], requiredPermission = null) => {
    if (userData.is_superuser) return true;
    if (allowedRoles.includes(userData.role)) return true;
    if (requiredPermission && userData.permissions.includes(requiredPermission)) return true;
    return false;
  };

  return (
    <Sidebar
      backgroundColor={colors.primary[400]}
      rootStyles={{ border: 0, height: "100%" }}
      collapsed={collapsed}
      toggled={toggled}
      breakPoint="md"
      onBackdropClick={() => setToggled(false)}
    >
      <Menu menuItemStyles={{ button: { ":hover": { background: "transparent" } } }}>
        <MenuItem
          rootStyles={{ margin: "10px 0 20px 0", color: colors.gray[100] }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            {!collapsed && (
              <Box display="flex" alignItems="center" gap="12px">
                <img
                  src={logo}
                  alt="Ministère de la Justice RDC"
                  style={{ width: "34px", height: "34px", borderRadius: "6px", boxShadow: "0 2px 5px rgba(0,0,0,0.3)" }}
                />
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="#007FFF" sx={{ letterSpacing: 1 }}>
                    SNGD
                  </Typography>
                  <Typography variant="caption" color={colors.gray[300]}>
                    Justice - RDC
                  </Typography>
                </Box>
              </Box>
            )}
            <IconButton onClick={() => setCollapsed(!collapsed)}>
              <MenuOutlined />
            </IconButton>
          </Box>
        </MenuItem>
      </Menu>
      <Menu>
  <MenuItem
    onClick={() => {
      if (window.confirm("Voulez-vous vraiment vous déconnecter ?")) {
        handleLogout();
      }
    }}
    icon={
      <Tooltip title="Déconnexion">
        <ExitToAppOutlined sx={{ color: colors.redAccent[500] }} />
      </Tooltip>
    }
    style={{
      marginTop: "20px",
      color: colors.redAccent[500],
      fontWeight: "bold"
    }}
  >
    {!collapsed && "Déconnexion"}
  </MenuItem>
</Menu>

      {!collapsed && (
        <Box display="flex" flexDirection="column" alignItems="center" gap="5px" mb="25px">
          <Avatar src={avatar} sx={{ width: 85, height: 85, border: `2px solid ${colors.greenAccent[500]}` }} />
          <Box display="flex" alignItems="center" gap="5px" mt="10px">
            <Typography variant="h6" fontWeight="bold" color={colors.gray[100]} textTransform="capitalize">
              {userData.username}
            </Typography>
            {userData.is_superuser && <VerifiedUser sx={{ fontSize: 16, color: "#007FFF" }} />}
          </Box>
          <Typography variant="body2" color={colors.greenAccent[500]} fontWeight="600">
            {userData.role}
          </Typography>
        </Box>
      )}

      <Box mb={5} pl={collapsed ? undefined : "5%"}>
        {/* ================= DASHBOARD ================= */}
        <Menu>
          <Item title="Tableau de Bord" path="/" colors={colors} icon={<DashboardOutlined />} />
        </Menu>

        {/* ================= GESTION DES DÉTENUS ================= */}
        {hasAccess(["ADMIN", "DIRECTEUR", "AGENT", "SECURITE"]) && (
          <>
            <Typography variant="h6" color={colors.gray[300]} sx={{ m: "15px 0 5px 20px" }}>
              {!collapsed ? "Gestion des Détenus" : " "}
            </Typography>
            <Menu>
              <Item title="Liste des Détenus" path="/detenus/liste" colors={colors} icon={<PeopleAltOutlined />} />
              <Item title="Enregistrement Détenu" path="/detenus/nouveau" colors={colors} icon={<PersonOutlined />} />
              <Item title="Validation Décès" path="/validation-deces" colors={colors} icon={<EventNoteOutlined />} />
              <Item title="Dossiers Judiciaires" path="/detenus/juridique" colors={colors} icon={<ContactsOutlined />} />
              <Item title="Identification Biométrique" path="/detenus/identification" colors={colors} icon={<ContactsOutlined />} />
              <Item title="Alertes Juridiques" path="/detenus/alertes" colors={colors} icon={<WarningAmber sx={{ color: colors.redAccent[500] }} />} />
              <Item title="Libération" path="/detenus/liberation" colors={colors} icon={<ExitToAppOutlined />} />
              <Item title="Affectation Cellules" path="/detenus/affectations" colors={colors} icon={<MapOutlined />} />
              <Item title="Cartes Détenus" path="/detenus/carte" colors={colors} icon={<ReceiptOutlined />} />
            </Menu>
          </>
        )}

        {/* ================= VIE CARCÉRALE ================= */}
        {hasAccess(["ADMIN", "DIRECTEUR", "AGENT", "SECURITE", "MEDECIN"]) && (
          <>
            <Typography variant="h6" color={colors.gray[300]} sx={{ m: "15px 0 5px 20px" }}>
              {!collapsed ? "Vie Carcérale" : " "}
            </Typography>
            <Menu>
              <Item title="Vie Carcérale" path="/carcerale" colors={colors} icon={<CheckCircleOutline />} />
              <Item title="Contrôle de Présence" path="/carcerale/controle" colors={colors} icon={<CheckCircleOutline />} />
              <Item title="Sorties & Retours" path="/carcerale/mouvement" colors={colors} icon={<TimelineOutlined />} />
              <Item title="Suivi Médical" path="/carcerale/medical" colors={colors} icon={<HelpOutlineOutlined />} />
              <Item title="Cantine" path="/carcerale/cantine" colors={colors} icon={<DonutLargeOutlined />} />
              <Item title="Déclaration Deces" path="/carcerale/deces" colors={colors} icon={<DescriptionOutlined />} />
              <Item title="Dashboard Medecine" path="/dashboard-medecin" colors={colors} icon={<MedicalServicesOutlined />} />

            </Menu>
          </>
        )}

        {/* ================= VISITEURS ================= */}
        {hasAccess(["ADMIN", "DIRECTEUR", "SECURITE"]) && (
          <>
            <Typography variant="h6" color={colors.gray[300]} sx={{ m: "15px 0 5px 20px" }}>
              {!collapsed ? "Visiteurs" : " "}
            </Typography>
            <Menu>
              <Item title="Gestion des Visiteurs" path="/visiteurs" colors={colors} icon={<PeopleAltOutlined />} />
              <Item title="Intelligence Visiteurs" path="/visiteurs/intelligence" colors={colors} icon={<InsightsOutlined />} />
              <Item title="Visites" path="/visiteurs/visites" colors={colors} icon={<CalendarTodayOutlined />} />
              <Item title="Controle d'Accès" path="/visiteurs/control" colors={colors} icon={<CheckCircleOutline />} />
              <Item title="Fiches de Renseignement" path="/visiteurs/ficheintelligent" colors={colors} icon={<DescriptionOutlined />} />
              <Item title="Self-Service Biometrique" path="/visiteurs/selfservice" colors={colors} icon={<ContactsOutlined />} />
              <Item title="Cartes Visiteurs" path="/visiteurs/cartes" colors={colors} icon={<ReceiptOutlined />} />
            </Menu>
          </>
        )}

        {/* ================= PERSONNEL ================= */}
        {hasAccess(["ADMIN", "DIRECTEUR", "MINISTRE"]) && (
          <>
            <Typography variant="h6" color={colors.gray[300]} sx={{ m: "15px 0 5px 20px" }}>
              {!collapsed ? "Personnel Pénitentiaire" : " "}
            </Typography>
            <Menu>
              <Item title="Personnel" path="/personnel" colors={colors} icon={<PersonOutlined />} />
              <Item title="Présences Personnel" path="/personnel/presence" colors={colors} icon={<CheckCircleOutline />} />
              <Item title="Presence en Temps Réel" path="/personnel/kiosque" colors={colors} icon={<MapOutlined />} />
              <Item title="Gestion Agents" path="/personnel/gestion" colors={colors} icon={<PeopleAltOutlined />} />
              <Item title="Biométrie Personnel" path="/personnel/biometriepersonnel" colors={colors} icon={<ContactsOutlined />} />
              <Item title="Horaires & Congés" path="/personnel/horaires" colors={colors} icon={<CalendarTodayOutlined />} />
            </Menu>
          </>
        )}

        {/* ================= GESTION GLOBALE ================= */}
        {hasAccess(["ADMIN"]) && (
          <>
            <Typography variant="h6" color={colors.gray[300]} sx={{ m: "15px 0 5px 20px" }}>
              {!collapsed ? "Gestion Globale" : " "}
            </Typography>
            <Menu>
              <Item title="Paramètres Système" path="/parametres" colors={colors} icon={<SettingsOutlined />} />
              <Item title="Logs & Audits" path="/audit-logs" colors={colors} icon={<TimelineOutlined />} />
              <Item title="Audit d'Authentification" path="/auth-audit" colors={colors} icon={<SecurityOutlined />} />
              <Item title="Maintenance" path="/maintenance" colors={colors} icon={<BuildOutlined />} />
            </Menu>
          </>
        )}

        {/* ================= INFRASTRUCTURE ================= */}
        {hasAccess(["ADMIN", "MINISTRE", "DIRECTEUR"]) && (
          <>
            <Typography variant="h6" color={colors.gray[300]} sx={{ m: "15px 0 5px 20px" }}>
              {!collapsed ? "Infrastructure" : " "}
            </Typography>
            <Menu>
              <Item title="Gestion des Provinces" path="/provinces" colors={colors} icon={<PublicOutlined />} />
              <Item title="Gestion des Villes" path="/villes" colors={colors} icon={<LocationCityOutlined />} />
              <Item title="Gestion des Prisons" path="/prisons" colors={colors} icon={<AccountBalanceOutlined />} />
              <Item title="Gestion des Pavillons" path="/pavillons" colors={colors} icon={<ApartmentOutlined />} />
              <Item title="Gestion des Cellules" path="/cellules" colors={colors} icon={<MeetingRoomOutlined />} />
            </Menu>
          </>
        )}

        {/* ================= DETENUS (Section 2) ================= */}
        {hasAccess(["ADMIN", "DIRECTEUR", "AGENT", "SECURITE"]) && (
          <>
            <Typography variant="h6" color={colors.gray[300]} sx={{ m: "15px 0 5px 20px" }}>
              {!collapsed ? "Gestion des Détenus" : " "}
            </Typography>
            <Menu>
              <Item title="Gestion des Dossiers judiciaires" path="/dossiers" colors={colors} icon={<GavelOutlined />} />
              <Item title="Gestion des Documents Ecrou" path="/documents-ecrou" colors={colors} icon={<GavelOutlined />} />
              <Item title="Gestion des Affectations cellules" path="/managaffectations" colors={colors} icon={<SwapHorizOutlined />} />
              <Item title="Gestion des Mouvements extérieurs" path="/mouvements-exterieurs-manage" colors={colors} icon={<DirectionsWalkOutlined />} />
              <Item title="Gestion des Décès" path="/manage-deces" colors={colors} icon={<DirectionsWalkOutlined />} />
              <Item title="Absences" path="/absences" colors={colors} icon={<EventBusyOutlined />} />
            </Menu>
          </>
        )}

        {/* ================= VISITEURS & SECURITE ================= */}
        {hasAccess(["ADMIN", "DIRECTEUR", "SECURITE"]) && (
          <>
            <Typography variant="h6" color={colors.gray[300]} sx={{ m: "15px 0 5px 20px" }}>
              {!collapsed ? "Visiteurs & Sécurité" : " "}
            </Typography>
            <Menu>
              <Item title="Gestion des Visiteurs" path="/visiteurs" colors={colors} icon={<BadgeOutlined />} />
              <Item title="Gestion du Contrôle biométrique" path="/biometrie" colors={colors} icon={<SwapHorizOutlined />} />
              <Item title="Journal d'activité" path="/journal" colors={colors} icon={<ListAltOutlined />} />
            </Menu>
          </>
        )}

        {/* ================= SANTÉ ================= */}
        {hasAccess(["ADMIN", "DIRECTEUR", "MEDECIN"]) && (
          <>
            <Typography variant="h6" color={colors.gray[300]} sx={{ m: "15px 0 5px 20px" }}>
              {!collapsed ? "Santé & Médical" : " "}
            </Typography>
            <Menu>
              <Item title="Consultations" path="/consultations" colors={colors} icon={<LocalHospitalOutlined />} />
              <Item title="Stock médicaments" path="/medicaments" colors={colors} icon={<MedicationOutlined />} />
            </Menu>
          </>
        )}

        {/* ================= CANTINE ================= */}
        {hasAccess(["ADMIN", "DIRECTEUR", "INTENDANT"]) && (
          <>
            <Typography variant="h6" color={colors.gray[300]} sx={{ m: "15px 0 5px 20px" }}>
              {!collapsed ? "Cantine & Stock" : " "}
            </Typography>
            <Menu>
              <Item title="Articles cantine" path="/articles" colors={colors} icon={<StorefrontOutlined />} />
              <Item title="Transactions" path="/transactions" colors={colors} icon={<ShoppingCartOutlined />} />
              <Item title="Mouvements de stock" path="/stocks" colors={colors} icon={<InventoryOutlined />} />
            </Menu>
          </>
        )}

        {/* ================= PERSONNEL (Section 2) ================= */}
        {hasAccess(["ADMIN", "DIRECTEUR", "MINISTRE"]) && (
          <>
            <Typography variant="h6" color={colors.gray[300]} sx={{ m: "15px 0 5px 20px" }}>
              {!collapsed ? "Personnel" : " "}
            </Typography>
            <Menu>
              <Item title="Agents" path="/agents" colors={colors} icon={<SecurityOutlined />} />
              <Item title="Parquets" path="/parquets" colors={colors} icon={<AccountBalance />} />
              <Item title="Tribunaux" path="/tribunaux" colors={colors} icon={<Gavel />} />
            </Menu>
          </>
        )}

        {/* ================= ACTIVITÉS ================= */}
        {hasAccess(["ADMIN", "DIRECTEUR", "AGENT", "INTENDANT"]) && (
          <>
            <Typography variant="h6" color={colors.gray[300]} sx={{ m: "15px 0 5px 20px" }}>
              {!collapsed ? "Activités" : " "}
            </Typography>
            <Menu>
              <Item title="Corvées, Activités journalières et Rations" path="/centres-operations" colors={colors} icon={<ConstructionOutlined />} />
              <Item title="Rations alimentaires" path="/preci" colors={colors} icon={<RestaurantOutlined />} />
            </Menu>
          </>
        )}

        {/* ================= ADMINISTRATION ================= */}
        {hasAccess(["ADMIN", "MINISTRE"]) && (
          <>
            <Typography variant="h6" color={colors.gray[300]} sx={{ m: "15px 0 5px 20px" }}>
              {!collapsed ? "Administration" : " "}
            </Typography>
            <Menu>
              <Item title="Utilisateurs & Rôles" path="/users" colors={colors} icon={<PersonOutlined />} />
              <Item title="Permissions" path="/permissions" colors={colors} icon={<SecurityOutlined />} />
              <Item title="Corbeille" path="/corbeille" colors={colors} icon={<DeleteOutlineOutlined />} />
              <Item title="Aide & Support" path="/support" colors={colors} icon={<HelpOutlineOutlined />} />
              <Item title="Intelligence ARN" path="/intelligence" colors={colors} icon={<InsightsOutlined />} />
              <Item title="Dashboard Ministre" path="/dashministre" colors={colors} icon={<DashboardOutlined />} />
              <Item title="Dashboard IA" path="/dashia" colors={colors} icon={<DashboardOutlined />} />
              <Item title="Cartes & Géolocalisation" path="/geographie" colors={colors} icon={<MapOutlined />} />
            </Menu>
          </>
        )}

        {/* ================= STATISTIQUES ================= */}
        {hasAccess(["ADMIN", "MINISTRE", "DIRECTEUR"]) && (
          <>
            <Typography variant="h6" color={colors.gray[300]} sx={{ m: "15px 0 5px 20px" }}>
              {!collapsed ? "Analyses" : " "}
            </Typography>
            <Menu>
              <Item title="Statistiques" path="/bar" colors={colors} icon={<BarChartOutlined />} />
              <Item title="Répartition" path="/pie" colors={colors} icon={<DonutLargeOutlined />} />
              <Item title="Flux (Entrées/Sorties)" path="/stream" colors={colors} icon={<WavesOutlined />} />
            </Menu>
          </>
        )}
      </Box>
    </Sidebar>
  );
};

export default SideBar;