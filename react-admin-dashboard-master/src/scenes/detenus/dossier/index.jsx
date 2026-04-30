import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Box, Button, Typography, useTheme, Grid, Paper, 
  Avatar, Divider, Chip, Stack, CircularProgress, LinearProgress,
  alpha 
} from "@mui/material";
import { tokens } from "../../../theme";
import { 
  ArrowBack, Print, Gavel, Apartment,
  Restaurant, AccountBalanceWallet, FamilyRestroom, 
  EditOutlined, AccessibilityNew, WarningAmber,
  CakeOutlined, WcOutlined, PhoneOutlined, WorkOutline
} from "@mui/icons-material";
import Header from "../../../components/Header";
import api from "../../../api";

// --- COULEURS NATIONALES RDC ---
const RDC_BLUE = "#007FFF";   
const RDC_YELLOW = "#F7D618"; 
const RDC_RED = "#CE1021";    

const DossierDetenu = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isDark = theme.palette.mode === "dark";

  const [detenu, setDetenu] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
        try {
            const res = await api.get(`http://127.0.0.1:8000/api/detenus/${id}/`);
            setDetenu(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Erreur de chargement", err);
            setLoading(false);
        }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress size={60} sx={{ color: RDC_BLUE }} /></Box>;
  if (!detenu) return <Box m="20px"><Typography variant="h5" fontWeight="bold" color="error">Dossier introuvable ou erreur de serveur.</Typography></Box>;

  // Formatage du statut pour l'affichage
  const statutAffiche = detenu.statut_juridique ? detenu.statut_juridique.replace('_', ' ') : "INCONNU";

  return (
    <Box m="20px">
      {/* HEADER ACTIONS */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
            <Button 
                startIcon={<ArrowBack fontSize="large" />} 
                onClick={() => navigate(-1)} 
                size="large"
                sx={{ color: isDark ? colors.gray[100] : RDC_BLUE, fontWeight: "900", fontSize: "1.1rem" }}
            >
                RETOUR
            </Button>
            <Header title={`MATRICULE : ${detenu.matricule || "EN ATTENTE"}`} subtitle="Fiche Individuelle d'Identification Pénitentiaire" />
        </Stack>
        <Stack direction="row" spacing={2}>
            <Button 
                variant="outlined" 
                size="large"
                startIcon={<EditOutlined />}
                onClick={() => navigate(`/detenus/edit/${id}`)}
                sx={{ color: isDark ? "#fff" : "#000", borderColor: isDark ? "#fff" : "#000", fontWeight: "900", fontSize: "1rem" }}
            >
                MODIFIER
            </Button>
            <Button 
                variant="contained" 
                size="large"
                startIcon={<Print />} 
                sx={{ bgcolor: RDC_BLUE, color: "white", fontWeight: "900", fontSize: "1rem" }}
            >
                IMPRIMER
            </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        
        {/* COLONNE GAUCHE : PHOTO & SOLDE */}
        <Grid item xs={12} md={4} lg={3}>
            <Stack spacing={3}>
                <Paper sx={{ 
                    p: 3, bgcolor: isDark ? colors.primary[400] : "#fff", textAlign: "center", 
                    borderTop: `6px solid ${RDC_BLUE}`, boxShadow: "none", border: `1px solid ${alpha(isDark ? "#fff" : "#000", 0.1)}`
                }}>
                    <Avatar 
                        src={detenu.photo} 
                        variant="square" 
                        sx={{ width: "100%", height: "auto", aspectRatio: "3/4", mb: 2, border: `3px solid ${RDC_YELLOW}`, borderRadius: 0 }} 
                    />
                    <Typography variant="h3" fontWeight="900" color={RDC_BLUE} sx={{ textTransform: "uppercase" }}>{detenu.nom}</Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>{detenu.postnom} {detenu.prenom}</Typography>
                    
                    <Chip 
                        label={statutAffiche} 
                        sx={{ 
                            width: "100%", fontWeight: "900", fontSize: "1.1rem", py: 2.5, borderRadius: 1,
                            bgcolor: (detenu.statut_juridique === "CONDAMNE" || detenu.statut_juridique === "MORT") ? RDC_RED : RDC_BLUE, 
                            color: "#fff" 
                        }} 
                    />

                    {/* Alerte Haute Sécurité si coché */}
                    {detenu.est_dangereux && (
                        <Chip 
                            icon={<WarningAmber style={{ color: '#000' }} />}
                            label="PROFIL HAUTE SÉCURITÉ" 
                            sx={{ mt: 1.5, width: "100%", fontWeight: "900", bgcolor: RDC_YELLOW, color: "#000", borderRadius: 1 }} 
                        />
                    )}
                </Paper>

                <Paper sx={{ p: 2.5, bgcolor: isDark ? colors.primary[400] : "#fff", borderLeft: `6px solid ${RDC_YELLOW}` }}>
                    <Typography variant="h6" fontWeight="900" display="flex" alignItems="center" gap={1}>
                        <AccountBalanceWallet /> SOLDE CANTINE
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="h3" color={RDC_BLUE} fontWeight="900">
                        {detenu.solde || "0.00"} <span style={{fontSize: '16px'}}>CDF</span>
                    </Typography>
                    <Typography variant="body2" fontWeight="700" sx={{ opacity: 0.7, mt: 0.5 }}>Fonds disponibles en interne</Typography>
                </Paper>
            </Stack>
        </Grid>

        {/* COLONNE DROITE : DÉTAILS */}
        <Grid item xs={12} md={8} lg={9}>
            <Stack spacing={3}>
                
                {/* 1. DOSSIER JUDICIAIRE (Statut, Autorité, Entrée) */}
                <SectionBox title="SITUATION JUDICIAIRE ET ÉCROU" icon={<Gavel fontSize="large" />} accentColor={RDC_RED}>
                    <Grid container spacing={2}>
                        <InfoItem label="Statut Pénal Actuel" value={statutAffiche} col={4} color={RDC_RED} />
                        <InfoItem label="Autorité Judiciaire (Juridiction)" value={detenu.autorite_judiciaire || "Non spécifiée"} col={8} />
                        <InfoItem label="Date d'entrée (Écrou)" value={detenu.date_entree ? new Date(detenu.date_entree).toLocaleDateString('fr-FR') : "—"} col={4} />
                        <InfoItem label="Établissement Pénitentiaire" value={detenu.prison_info?.nom || detenu.prison_nom || "—"} col={8} />
                    </Grid>
                </SectionBox>

                {/* 2. LOCALISATION & LOGISTIQUE */}
                <SectionBox title="LOCALISATION ET LOGISTIQUE INTERNE" icon={<Apartment fontSize="large" />} accentColor={RDC_YELLOW}>
                    <Grid container spacing={2}>
                        <InfoItem label="État de présence" value={detenu.etat} color={detenu.etat === 'ABSENT' ? RDC_RED : "#2e7d32"} col={4} />
                        <InfoItem label="Pavillon Actuel" value={detenu.pavillon_actuel || "Non assigné"} col={4} />
                        <InfoItem label="Cellule Actuelle" value={detenu.cellule_actuelle || "Non assignée"} col={4} />
                        <InfoItem label="Régime Alimentaire" value={detenu.regime_alimentaire || "Normal"} icon={<Restaurant sx={{fontSize: 18}} />} col={12} />
                    </Grid>
                </SectionBox>

                {/* 3. SIGNALEMENT PHYSIQUE */}
                <SectionBox title="SIGNALEMENT PHYSIQUE" icon={<AccessibilityNew fontSize="large" />} accentColor={RDC_BLUE}>
                    <Grid container spacing={2}>
                        <InfoItem label="Taille" value={detenu.taille ? `${detenu.taille} cm` : "—"} col={4} />
                        <InfoItem label="Teint" value={detenu.teint || "—"} col={4} />
                        <InfoItem label="Pointure" value={detenu.pointure || "—"} col={4} />
                        <InfoItem label="Signes Particuliers (Cicatrices, Tatouages)" value={detenu.signes_particuliers || "Néant"} col={12} />
                    </Grid>
                </SectionBox>

                {/* 4. ÉTAT CIVIL & FILIATION */}
                <SectionBox title="ÉTAT CIVIL ET IDENTIFICATION" icon={<FamilyRestroom fontSize="large" />} accentColor={isDark ? "#fff" : "#333"}>
                    <Grid container spacing={2}>
                        <InfoItem label="Sexe" value={detenu.sexe === 'M' ? 'Masculin' : 'Féminin'} icon={<WcOutlined sx={{fontSize: 18}}/>} col={4} />
                        <InfoItem label="Date de Naissance" value={detenu.date_naissance ? new Date(detenu.date_naissance).toLocaleDateString('fr-FR') : "—"} icon={<CakeOutlined sx={{fontSize: 18}}/>} col={4} />
                        <InfoItem label="Lieu de Naissance" value={detenu.lieu_naissance || "—"} col={4} />
                        
                        <InfoItem label="Nationalité" value={detenu.nationalite || "Congolaise"} col={4} />
                        <InfoItem label="État Civil" value={detenu.etat_civil ? detenu.etat_civil.replace('_', ' ') : "CELIBATAIRE"} col={4} />
                        <InfoItem label="Nombre d'enfants" value={detenu.nombre_enfants || "0"} col={4} />
                        
                        <InfoItem label="Profession avant incarcération" value={detenu.profession || "Sans profession"} icon={<WorkOutline sx={{fontSize: 18}}/>} col={6} />
                        <InfoItem label="Dernière adresse de résidence" value={detenu.adresse_residence || "Non communiquée"} col={6} />
                        
                        <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                        
                        <InfoItem label="Nom du Père" value={detenu.nom_pere || "Non renseigné"} col={6} />
                        <InfoItem label="Nom de la Mère" value={detenu.nom_mere || "Non renseigné"} col={6} />
                    </Grid>
                </SectionBox>

                {/* 5. CONTACT EN CAS D'URGENCE */}
                <SectionBox title="CONTACT EN CAS D'URGENCE" icon={<PhoneOutlined fontSize="large" />} accentColor={RDC_YELLOW}>
                    <Grid container spacing={2}>
                        <InfoItem label="Personne à contacter" value={detenu.contact_urgence_nom || "Non spécifié"} col={4} />
                        <InfoItem label="Lien de parenté" value={detenu.lien_parente || "—"} col={4} />
                        <InfoItem label="Numéro de Téléphone" value={detenu.contact_urgence_tel || "—"} col={4} />
                    </Grid>
                </SectionBox>

            </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

// --- COMPOSANTS INTERNES ---

const SectionBox = ({ title, icon, children, accentColor }) => {
    const isDark = useTheme().palette.mode === "dark";
    return (
        <Paper sx={{ p: 3, bgcolor: isDark ? tokens("dark").primary[400] : "#fff", borderLeft: `6px solid ${accentColor}`, boxShadow: "none", border: `1px solid ${alpha(isDark ? "#fff" : "#000", 0.05)}` }}>
            <Typography variant="h4" fontWeight="900" mb={2} display="flex" alignItems="center" gap={1.5} color={accentColor} component="div" sx={{ textTransform: "uppercase" }}>
                {icon} {title}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {children}
        </Paper>
    );
};

const InfoItem = ({ label, value, col = 4, color, icon }) => (
    <Grid item xs={12} md={col}>
        <Typography variant="subtitle2" color={RDC_BLUE} fontWeight="900" sx={{ textTransform: "uppercase", letterSpacing: 0.5, mb: 0.5 }} component="div">
            {label}
        </Typography>
        <Typography variant="h6" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: color || "inherit", fontSize: "1.1rem" }} component="div">
            {icon} {value || "—"}
        </Typography>
    </Grid>
);

export default DossierDetenu;