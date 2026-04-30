import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Grid, Divider, Chip, Avatar, Button, Stack, 
  Paper, alpha, IconButton, CircularProgress, Breadcrumbs, Link, useTheme
} from "@mui/material";
import {
  Print, VerifiedUser, Fingerprint, Badge, Gavel, 
  QrCodeScanner, ArrowBack, Security, Update, Block, History, 
  AdminPanelSettings, Refresh, ErrorOutline, Phone, Email, LocationOn, Work, Warning
} from "@mui/icons-material";
import { QRCodeSVG } from 'qrcode.react';
import api from "../../../api"; // Import de l'instance axios préconfigurée

// --- ASSETS ---
import sceauRdc from "../../../assets/gouvernement rdc.png"; 
import drapeauRdc from "../../../assets/rdc.png";

// --- PALETTE OFFICIELLE RDC ---
const RDC_BLUE = "#007FFF";
const RDC_RED = "#CE1126";
const RDC_YELLOW = "#F7D618";

// ==========================================================
// SOUS-COMPOSANTS DESIGN
// ==========================================================

const SectionTitle = ({ title, icon, isDark }) => (
  <Box sx={{ mb: 2, mt: 3 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
      <Box sx={{ color: RDC_BLUE, display: 'flex' }}>{icon}</Box>
      <Typography variant="overline" fontWeight={900} sx={{ 
        fontSize: '0.75rem', 
        letterSpacing: 2,
        color: isDark ? alpha("#fff", 0.7) : "#0B1120"
      }}>
        {title}
      </Typography>
    </Stack>
    <Divider sx={{ borderColor: alpha(RDC_BLUE, 0.3), borderBottomWidth: 2 }} />
  </Box>
);

const DataField = ({ label, val, highlight, isDark, fullWidth, color }) => (
  <Grid item xs={fullWidth ? 12 : 6} md={fullWidth ? 12 : 6}>
    <Box sx={{ 
      p: 1.5, 
      bgcolor: isDark ? alpha("#fff", 0.03) : alpha("#f1f5f9", 0.5), 
      borderRadius: "8px",
      borderLeft: highlight ? `4px solid ${color || RDC_BLUE}` : "none",
      height: '100%'
    }}>
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ 
        fontWeight: 700, 
        color: highlight && color ? color : (isDark ? "#fff" : "#000"),
        fontSize: highlight ? "0.9rem" : "0.85rem",
        wordBreak: "break-word"
      }}>
        {val || "---"}
      </Typography>
    </Box>
  </Grid>
);

// ==========================================================
// COMPOSANT PRINCIPAL
// ==========================================================

const ProfilAgent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAgent = async () => {
  try {
    setLoading(true);
    setError(null);

    const response = await api.get(`/agents/${id}/`);

    // ✅ axios retourne déjà les données ici
    const data = response.data;

    setAgent(data);

  } catch (err) {
    console.error("Erreur SNGD:", err);

    // gestion propre des erreurs axios
    if (err.response) {
      setError(err.response.data?.detail || "Agent introuvable dans le SNGD.");
    } else {
      setError("Erreur de connexion au serveur.");
    }

  } finally {
    setLoading(false);
  }
};

  useEffect(() => { fetchAgent(); }, [id]);

  const handlePrint = () => window.print();

  if (loading) return (
    <Box sx={{ minHeight: "90vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", bgcolor: isDark ? "#080C14" : "#F8FAFC" }}>
      <CircularProgress size={70} thickness={2} sx={{ color: RDC_BLUE, mb: 2 }} />
      <Typography variant="button" sx={{ letterSpacing: 4, color: RDC_BLUE }}>Accès au SNGD en cours...</Typography>
    </Box>
  );

  return (
    <Box sx={{ 
      p: { xs: 2, md: 4 }, 
      bgcolor: isDark ? "#080C14" : "#F1F5F9", 
      minHeight: "100vh",
      color: isDark ? "#fff" : "#000"
    }}>
      
      {/* HEADER DE NAVIGATION */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" sx={{ mb: 4, gap: 2 }}>
        <Box>
          <Breadcrumbs sx={{ mb: 1, "& .MuiBreadcrumbs-separator": { color: RDC_BLUE } }}>
            <Link underline="hover" color="inherit" onClick={() => navigate("/")} sx={{ cursor: 'pointer', fontSize: '0.75rem' }}>SNGD</Link>
            <Link underline="hover" color="inherit" onClick={() => navigate("/agents")} sx={{ cursor: 'pointer', fontSize: '0.75rem' }}>Base du Personnel</Link>
            <Typography color={RDC_BLUE} sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{agent?.matricule}</Typography>
          </Breadcrumbs>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: alpha(RDC_BLUE, 0.1), color: RDC_BLUE }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -1 }}>
              DOSSIER <span style={{ color: RDC_BLUE }}>BIOMÉTRIQUE</span>
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={2}>
          {agent?.est_officier_judiciaire && (
            <Chip label="OFFICIER JUDICIAIRE" sx={{ bgcolor: RDC_BLUE, color: "#fff", fontWeight: 900, borderRadius: "4px" }} icon={<Security sx={{ color: "#fff !important" }} />} />
          )}
          <Chip 
            label={agent?.statut} 
            sx={{ bgcolor: agent?.statut_couleur || "#ccc", color: "#000", fontWeight: 900, height: 40, borderRadius: "4px" }} 
          />
        </Stack>
      </Stack>

      <Grid container spacing={4}>
        
        {/* COLONNE GAUCHE : FICHE OFFICIELLE (PRINT-READY) */}
        <Grid item xs={12} lg={8}>
          <Paper 
            id="printable-fiche"
            elevation={0}
            sx={{ 
              bgcolor: "#fff", color: "#000", borderRadius: "2px", position: "relative",
              border: "1px solid #E2E8F0", boxShadow: isDark ? `0 0 40px ${alpha(RDC_BLUE, 0.1)}` : "0 10px 25px rgba(0,0,0,0.05)"
            }}
          >
            {/* Barre de contrôle SNGD (Cachée au print) */}
            <Box sx={{ p: 2, bgcolor: "#0B1120", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", "@media print": { display: "none" } }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <img src={drapeauRdc} alt="RDC" style={{ height: 20 }} />
                <Typography variant="caption" fontWeight={900} sx={{ letterSpacing: 2 }}>SYSTÈME NATIONAL DE GESTION DES DÉTENUS & PERSONNEL</Typography>
              </Stack>
              <Button startIcon={<Print />} variant="contained" size="small" onClick={handlePrint} sx={{ bgcolor: RDC_BLUE, "&:hover": { bgcolor: "#0066CC" } }}>Imprimer Fiche A4</Button>
            </Box>

            <Box sx={{ p: { xs: 3, md: 5 }, position: "relative" }}>
              {/* FILIGRANE D'AUTHENTICITÉ */}
              <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-45deg)", opacity: 0.03, width: "80%", textAlign: "center", pointerEvents: "none" }}>
                <img src={sceauRdc} alt="Watermark" style={{ width: "100%" }} />
              </Box>

              {/* ENTÊTE OFFICIEL MINISTÈRE */}
              <Grid container alignItems="center" sx={{ mb: 4, position: "relative" }}>
                <Grid item xs={3}>
                  <img src={sceauRdc} alt="Sceau RDC" style={{ width: 100 }} />
                </Grid>
                <Grid item xs={6} textAlign="center">
                  <Typography variant="h6" fontWeight={900} sx={{ color: RDC_BLUE, lineHeight: 1.2 }}>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</Typography>
                  <Typography variant="body2" fontWeight={800} sx={{ color: RDC_RED }}>MINISTÈRE DE LA JUSTICE</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Secrétariat Général à la Justice</Typography>
                  <Box sx={{ width: 100, height: 3, bgcolor: RDC_YELLOW, mx: "auto", mt: 1 }} />
                </Grid>
                <Grid item xs={3} textAlign="right">
                  <Box sx={{ p: 1, border: "2px solid #000", display: "inline-block", textAlign: 'center' }}>
                    <Typography variant="caption" fontWeight={900} display="block">ID SYSTEME</Typography>
                    <Typography variant="h5" fontWeight={900}>#{agent?.id.toString().padStart(4, '0')}</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Grid container spacing={4} sx={{ position: "relative" }}>
                {/* PHOTO & QR CODE */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ border: "5px solid #F1F5F9", p: 0.5, mb: 2 }}>
                    <Avatar src={agent?.photo} variant="square" sx={{ width: "100%", height: 260, bgcolor: "#F8FAFC" }}>
                      <Badge sx={{ fontSize: 100, color: "#CBD5E1" }} />
                    </Avatar>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", textAlign: 'center' }}>
                    <QRCodeSVG value={`SNGD-AGENT-${agent?.uuid}`} size={120} />
                    <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 900, color: RDC_BLUE }}>AUTHENTIFICATION DIGITALE</Typography>
                  </Box>
                </Grid>

                {/* DONNEES DE L'AGENT */}
                <Grid item xs={12} md={8}>
                  <SectionTitle title="Identité Civile" icon={<Badge fontSize="small" />} isDark={false} />
                  <Grid container spacing={1.5}>
                    <DataField label="Nom Complet" val={agent?.nom_complet} fullWidth highlight />
                    <DataField label="Sexe" val={agent?.sexe === 'M' ? 'Masculin' : 'Féminin'} />
                    <DataField label="Groupe Sanguin" val={agent?.groupe_sanguin} color={RDC_RED} highlight />
                    <DataField label="Date de Naissance" val={agent?.date_naissance} />
                    <DataField label="Lieu de Naissance" val={agent?.lieu_naissance} />
                    <DataField label="NNI (Numéro National)" val={agent?.nni} fullWidth highlight />
                  </Grid>

                  <SectionTitle title="Carrière & Affectation" icon={<Work fontSize="small" />} isDark={false} />
                  <Grid container spacing={1.5}>
                    <DataField label="Matricule" val={agent?.matricule} highlight color={RDC_BLUE} />
                    <DataField label="Grade" val={agent?.grade} />
                    <DataField label="Échelon" val={agent?.echelon} />
                    <DataField label="Secteur" val={agent?.secteur} />
                    <DataField label="Lieu d'Affectation" val={agent?.affectation} fullWidth highlight />
                    <DataField label="Prise de fonction" val={agent?.date_prise_fonction} />
                    <DataField label="Fin de contrat" val={agent?.date_fin_contrat} />
                  </Grid>
                </Grid>

                {/* CONTACTS & URGENCE */}
                <Grid item xs={12}>
                  <SectionTitle title="Coordonnées & Sécurité" icon={<Phone fontSize="small" />} isDark={false} />
                  <Grid container spacing={1.5}>
                    <DataField label="Téléphone" val={agent?.telephone} />
                    <DataField label="Email Pro" val={agent?.email_professionnel} />
                    <DataField label="Adresse Résidence" val={agent?.adresse_residence} fullWidth />
                    <DataField label="Personne à prévenir" val={agent?.contact_urgence_nom} color={RDC_RED} highlight />
                    <DataField label="Tél. Urgence" val={agent?.contact_urgence_tel} highlight />
                  </Grid>
                </Grid>
              </Grid>

              {/* VALIDATION & SIGNATURE */}
              <Box sx={{ mt: 6, pt: 4, borderTop: "2px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: 'flex-end' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" fontWeight={900}>SIGNATURE DE L'AGENT</Typography>
                  <Box sx={{ height: 60, mt: 1 }}>
                    {agent?.scan_signature ? (
                      <img src={agent.scan_signature} alt="Signature" style={{ maxHeight: '100%' }} />
                    ) : (
                      <Box sx={{ width: 150, borderBottom: "1px dashed #000", mt: 4 }} />
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ textAlign: 'center', position: 'relative' }}>
                  <Typography variant="caption" fontWeight={900} sx={{ mb: 4, display: 'block' }}>CACHET DE LA DIRECTION</Typography>
                  <Box sx={{ 
                    border: `4px double ${alpha(RDC_RED, 0.4)}`, p: 1, color: alpha(RDC_RED, 0.5), 
                    transform: "rotate(-15deg)", borderRadius: "8px", fontWeight: 900, fontSize: "0.7rem"
                  }}>
                    CONTRÔLÉ & CERTIFIÉ SNGD<br/>{new Date(agent?.date_enrolement).toLocaleDateString()}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* COLONNE DROITE : TERMINAL DE CONTROLE */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3} sx={{ position: 'sticky', top: 20 }}>
            <Paper sx={{ p: 3, borderRadius: "12px", bgcolor: isDark ? "#111827" : "#fff", border: isDark ? "1px solid #1F2937" : "1px solid #E2E8F0" }}>
              <Typography variant="h6" fontWeight={900} sx={{ color: RDC_BLUE, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AdminPanelSettings /> ACTIONS ADMIN
              </Typography>
              <Stack spacing={2}>
                <Button fullWidth variant="contained" startIcon={<Update />} sx={{ bgcolor: RDC_BLUE, fontWeight: 900 }}>Mettre à jour le statut</Button>
                <Button fullWidth variant="outlined" startIcon={<Fingerprint />} sx={{ color: isDark ? "#fff" : "#000", borderColor: isDark ? "#374151" : "#E2E8F0" }}>Recalibrer Biométrie</Button>
                <Button fullWidth variant="outlined" startIcon={<History />} sx={{ color: isDark ? "#fff" : "#000", borderColor: isDark ? "#374151" : "#E2E8F0" }}>Historique Mutations</Button>
                <Divider />
                <Button fullWidth variant="contained" startIcon={<Block />} sx={{ bgcolor: RDC_RED, fontWeight: 900 }}>RÉVOQUER L'ACCÈS</Button>
              </Stack>
            </Paper>

            <Paper sx={{ p: 2, bgcolor: "#000", borderRadius: "8px", borderLeft: `4px solid ${RDC_BLUE}` }}>
              <Typography variant="caption" sx={{ color: RDC_BLUE, fontWeight: 900, fontFamily: 'monospace' }}>CONSOLE SNGD_v3.2.0</Typography>
              <Box sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.7rem', color: "#00FF41", lineHeight: 1.5 }}>
                <div>&gt; Connexion secure_tunnel_RDC_GOV... OK</div>
                <div>&gt; UUID: {agent?.uuid}</div>
                <div>&gt; Agent actif: {agent?.est_actif ? "TRUE" : "FALSE"}</div>
                <div>&gt; Scan integrité base de données... 100%</div>
                <div style={{ color: RDC_YELLOW, marginTop: 4 }}>&gt; Dernier pointage: {new Date().toLocaleTimeString()}</div>
              </Box>
            </Paper>

            {!agent?.est_actif && (
              <Box sx={{ p: 2, bgcolor: alpha(RDC_RED, 0.1), borderRadius: "8px", border: `1px solid ${RDC_RED}`, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Warning sx={{ color: RDC_RED }} />
                <Typography variant="caption" sx={{ color: RDC_RED, fontWeight: 900 }}>CET AGENT EST ACTUELLEMENT DÉSACTIVÉ DU SYSTÈME</Typography>
              </Box>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* CSS IMPRESSION */}
      <style>
        {`
          @media print {
            body { background: white !important; }
            #printable-fiche { 
              position: absolute; left: 0; top: 0; width: 210mm; height: 297mm;
              border: none !important; box-shadow: none !important;
            }
            header, nav, button, .MuiBreadcrumbs-root, .MuiGrid-item:last-child { display: none !important; }
          }
        `}
      </style>
    </Box>
  );
};

export default ProfilAgent;