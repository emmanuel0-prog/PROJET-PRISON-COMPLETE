import React, { useRef, useState, useEffect } from "react";
// 🚀 ON REMPLACE AXIOS PAR TON INSTANCE PERSONNALISÉE
import api from "../../../api"; 
import { 
  Box, Typography, Button, Paper, Stack, Grid,
  Autocomplete, TextField, Divider, List, ListItem, ListItemText, ListItemIcon, alpha, useTheme
} from "@mui/material";
import { useReactToPrint } from "react-to-print";
import { QRCodeSVG } from "qrcode.react";
import Header from "../../../components/Header";
import { 
  Print, Fingerprint, Security, History, SearchOutlined, Badge as BadgeIcon
} from "@mui/icons-material";

// --- IMAGES ---
import sceauRdc from "../../../assets/gouvernement rdc.png"; 
import drapeauRdc from "../../../assets/rdc.png";

// COULEURS OFFICIELLES RDC ET STATUTS
const RDC_BLUE = "#007FFF";   
const RDC_RED = "#CE1021";    
const RDC_YELLOW = "#F7D618"; 

const NOM_PRISONS = {
  "23": "PRISON CENTRALE DE MAKALA",
  "2": "PRISON MILITAIRE DE NDOLO",
  "3": "PRISON DE LUZUMU",
  "4": "PRISON CENTRALE DE KASAPA",
};

const getStatutConfig = (statut) => {
  const s = String(statut || "").toUpperCase();
  switch (s) {
    case 'PREVENU':
      return { color: RDC_YELLOW, label: "PRÉVENU", text: "#000", light: alpha(RDC_YELLOW, 0.1) };
    case 'DETENU_PREVENTIF':
      return { color: RDC_BLUE, label: "DÉTENU PRÉVENTIF", text: "#FFF", light: alpha(RDC_BLUE, 0.05) };
    case 'CONDAMNE':
      return { color: RDC_RED, label: "CONDAMNÉ DÉFINITIF", text: "#FFF", light: alpha(RDC_RED, 0.05) };
    case 'CONDAMNE_PREVENTIF':
      return { color: "#6200EA", label: "CONDAMNÉ PRÉVENTIF", text: "#FFF", light: alpha("#6200EA", 0.05) };
    case 'LIBERE':
      return { color: "#00C853", label: "LIBÉRÉ / EXPIRÉ", text: "#FFF", light: alpha("#00C853", 0.05) };
    case 'MORT':
      return { color: "#212121", label: "MORT EN DÉTENTION", text: "#FFF", light: alpha("#212121", 0.05) };
    default:
      return { color: "#4f513a", label: "STATUT NON DÉFINI", text: "#FFF", light: "#f9f9f9" };
  }
};

const InfoItem = ({ label, value }) => (
  <Box>
    <Typography sx={{ fontSize: '7px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
    <Typography sx={{ fontSize: '11px', fontWeight: 800, color: '#111', mt: -0.2, fontFamily: 'sans-serif' }}>{value || "N/A"}</Typography>
  </Box>
);

const generateMRZ = (detenu) => {
  const nom = (detenu.nom || "X").toUpperCase().replace(/[^A-Z]/g, '');
  const postnom = (detenu.postnom || "X").toUpperCase().replace(/[^A-Z]/g, '');
  const mat = (detenu.matricule || "000").toUpperCase().replace(/[^A-Z0-9]/g, '');
  const line1 = `IDCOD${mat}<<<<<<<<<<<<<<<<<<<<<<<<<`.substring(0, 30);
  const line2 = `${nom}<<${postnom}<<<<<<<<<<<<<<<<<<<<<<<<<`.substring(0, 30);
  return `${line1}\n${line2}`;
};

const CarteAImprimer = React.forwardRef(({ detenu }, ref) => {
  const statutConfig = getStatutConfig(detenu.statut_juridique);
  const nomPrison = NOM_PRISONS[String(detenu.prison)] || `CENTRE DE REEDUCATION ${detenu.prison}`;
  const mrzText = generateMRZ(detenu);

  return (
    <div ref={ref}>
      <style>{`
        @media print { 
          @page { size: landscape; margin: 0; } 
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
        }
      `}</style>
      
      <Paper elevation={0} sx={{ 
        width: "540px", height: "340px", bgcolor: "#ffffff", 
        border: `2px solid ${statutConfig.color}`, 
        borderRadius: "12px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: `0px 10px 30px ${alpha(statutConfig.color, 0.3)}`,
        backgroundImage: `linear-gradient(${alpha(statutConfig.color, 0.03)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(statutConfig.color, 0.03)} 1px, transparent 1px)`,
        backgroundSize: '15px 15px'
      }}>
        
        <Box 
          component="img" 
          src={sceauRdc} 
          sx={{ 
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", 
            width: "250px", height: "250px", opacity: 0.04, zIndex: 0, 
            borderRadius: "50%", objectFit: "cover" 
          }} 
        />
        
        <Box sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${statutConfig.color}`, zIndex: 1, bgcolor: "#ffffff" }}>
          <Box component="img" src={sceauRdc} sx={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover", border: '1px solid #eee' }} />
          
          <Box textAlign="center">
            <Typography variant="caption" fontWeight="900" color="#1a237e" sx={{ letterSpacing: 2, textTransform: 'uppercase', fontSize: '10px' }}>
              République Démocratique du Congo
            </Typography>
            <Typography variant="caption" display="block" sx={{ fontWeight: 900, color: RDC_RED, fontSize: '11px', letterSpacing: 1 }}>
              MINISTÈRE DE LA JUSTICE ET GARDE DES SCEAUX
            </Typography>
            <Typography variant="caption" display="block" sx={{ fontSize: '12px', fontWeight: 900, color: statutConfig.color, mt: 0.2 }}>
              {nomPrison}
            </Typography>
          </Box>

          <Box component="img" src={drapeauRdc} sx={{ width: "45px", borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </Box>

        <Box sx={{ width: '100%', bgcolor: statutConfig.color, py: 0.8, textAlign: 'center', zIndex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <Typography sx={{ color: statutConfig.text, fontWeight: 900, fontSize: '12px', letterSpacing: 3 }}>
            {statutConfig.label}
          </Typography>
        </Box>

        <Box display="flex" p={2} gap={3} flex={1} sx={{ zIndex: 1 }}>
          <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
            <Box sx={{ 
                width: "110px", height: "135px", border: `3px solid ${statutConfig.color}`, 
                borderRadius: '8px', overflow: 'hidden', bgcolor: "#f0f0f0", position: 'relative'
            }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '15px', height: '15px', borderTop: '3px solid white', borderLeft: '3px solid white', zIndex: 2 }} />
              <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: '15px', height: '15px', borderBottom: '3px solid white', borderRight: '3px solid white', zIndex: 2 }} />
              <Box component="img" src={detenu.photo || "/assets/placeholder-profile.png"} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
            <Box display="flex" alignItems="center" gap={0.5} sx={{ color: statutConfig.color, bgcolor: statutConfig.light, px: 1, py: 0.5, borderRadius: '4px' }}>
              <Fingerprint sx={{ fontSize: 16 }} />
              <Typography sx={{ fontSize: '8px', fontWeight: 900, letterSpacing: 0.5 }}>BIOMÉTRIE VALIDÉE</Typography>
            </Box>
          </Box>

          <Box flex={1} display="flex" flexDirection="column" justifyContent="center">
            <Stack spacing={1.5}>
              <Box>
                <Typography sx={{ fontSize: '8px', color: '#666', fontWeight: 'bold' }}>NOM COMPLET / FULL NAME</Typography>
                <Typography variant="body1" fontWeight="900" color="#000" sx={{ fontSize: '18px', mt: -0.3, lineHeight: 1.1 }}>
                  {detenu.nom?.toUpperCase()} {detenu.postnom?.toUpperCase()} {detenu.prenom}
                </Typography>
              </Box>
              
              <Grid container spacing={1.5}>
                <Grid item xs={6}><InfoItem label="SEXE / SEX" value={detenu.sexe === 'M' ? 'MASCULIN (M)' : 'FÉMININ (F)'} /></Grid>
                <Grid item xs={6}><InfoItem label="NATIONALITÉ / NAT" value={detenu.nationalite} /></Grid>
                <Grid item xs={12}><InfoItem label="DATE ET LIEU DE NAISSANCE / DOB & POB" value={`${detenu.date_naissance} à ${detenu.lieu_naissance}`} /></Grid>
                <Grid item xs={12}><InfoItem label="AUTORITÉ JUDICIAIRE / AUTHORITY" value={detenu.autorite_judiciaire} /></Grid>
              </Grid>
            </Stack>
          </Box>

          <Box display="flex" flexDirection="column" justifyContent="flex-start" alignItems="center">
            <Box sx={{ p: 0.5, bgcolor: "white", border: `2px solid ${alpha(statutConfig.color, 0.5)}`, borderRadius: '6px', mb: 1 }}>
              <QRCodeSVG value={`MAT:${detenu.matricule}|ST:${detenu.statut_juridique}`} size={65} />
            </Box>
            <Box sx={{ textAlign: 'center', bgcolor: statutConfig.light, px: 1, py: 0.5, borderRadius: '4px' }}>
              <Typography sx={{ fontSize: '7px', fontWeight: 900, color: '#666' }}>N° MATRICULE</Typography>
              <Typography fontWeight="900" sx={{ color: statutConfig.color, fontSize: '14px', fontFamily: 'monospace' }}>{detenu.matricule}</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ bgcolor: "#f8f9fa", p: 1, borderTop: "1px solid #ddd", zIndex: 1 }}>
          <Typography sx={{ 
            fontFamily: "'Courier New', Courier, monospace", 
            fontSize: '11px', 
            fontWeight: 'bold', 
            lineHeight: 1.2, 
            letterSpacing: 2, 
            color: '#333',
            whiteSpace: 'pre-line'
          }}>
            {mrzText}
          </Typography>
        </Box>
      </Paper>
    </div>
  );
});

const CarteDetenu = () => {
  const componentRef = useRef();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [listeDetenus, setListeDetenus] = useState([]);
  const [selectedDetenu, setSelectedDetenu] = useState(null);
  const [historique, setHistorique] = useState([]);

  // --- LOGIQUE MISE À JOUR AVEC TON INTERCEPTEUR ---
  useEffect(() => {
    // Note: On utilise 'api' au lieu de 'axios' 
    // et on ne met que la fin de l'URL car baseURL est déjà définie
    api.get("detenus/") 
      .then(res => setListeDetenus(res.data))
      .catch(err => console.error("Erreur API sécurisée:", err));
  }, []);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onAfterPrint: () => {
      if (selectedDetenu && !historique.find(h => h.id === selectedDetenu.id)) {
        setHistorique([selectedDetenu, ...historique].slice(0, 5));
      }
    }
  });

  return (
    <Box m="30px">
      <Header title="CENTRE D'IDENTIFICATION" subtitle="Génération et impression des cartes biométriques sécurisées" />

      <Grid container spacing={4} mt="10px">
        <Grid item xs={12} md={3.5}>
          <Stack spacing={3}>
            <Paper elevation={3} sx={{ p: 2, borderRadius: '12px', bgcolor: 'background.paper' }}>
              <Box display="flex" alignItems="center" gap={1} mb={2} color={RDC_BLUE}>
                <SearchOutlined fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold">RECHERCHE RAPIDE</Typography>
              </Box>
              <Autocomplete
                options={listeDetenus}
                getOptionLabel={(o) => `${o.matricule} - ${o.nom} ${o.postnom}`}
                onChange={(e, v) => setSelectedDetenu(v)}
                renderInput={(params) => <TextField {...params} label="Entrez un matricule ou nom" variant="outlined" size="small" />}
              />
            </Paper>

            <Paper elevation={3} sx={{ p: 2, borderRadius: '12px', bgcolor: 'background.paper' }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <History fontSize="small" color="action" />
                <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">RÉCENTS (HISTORIQUE)</Typography>
              </Box>
              <Divider sx={{ mb: 1 }} />
              <List dense>
                {historique.length === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                    Aucune carte imprimée récemment.
                  </Typography>
                )}
                {historique.map((det, i) => (
                  <ListItem key={i} button onClick={() => setSelectedDetenu(det)} sx={{ borderRadius: '8px', mb: 0.5, '&:hover': { bgcolor: 'action.hover' } }}>
                    <ListItemIcon>
                        <BadgeIcon sx={{ color: getStatutConfig(det.statut_juridique).color }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${det.nom} ${det.postnom}`} 
                      secondary={det.matricule} 
                      primaryTypographyProps={{ fontWeight: 'bold' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Stack>
        </Grid>

        <Grid item xs={12} md={8.5}>
          <Paper elevation={isDark ? 3 : 0} sx={{ 
            p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', 
            borderRadius: '16px', border: isDark ? 'none' : '1px dashed #cbd5e0', 
            bgcolor: isDark ? 'background.paper' : '#f8fafc', 
            minHeight: '550px', justifyContent: 'center'
          }}>
            {selectedDetenu ? (
              <Stack alignItems="center" spacing={5}>
                <Box sx={{ 
                  filter: 'drop-shadow(0px 20px 40px rgba(0,0,0,0.15))',
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'scale(1.02)' }
                }}>
                  <CarteAImprimer ref={componentRef} detenu={selectedDetenu} />
                </Box>
                
                <Button 
                  variant="contained" 
                  onClick={handlePrint} 
                  startIcon={<Print />}
                  sx={{ 
                    bgcolor: getStatutConfig(selectedDetenu.statut_juridique).color, 
                    color: getStatutConfig(selectedDetenu.statut_juridique).text,
                    px: 6, py: 1.5, borderRadius: "8px", fontWeight: "900", fontSize: "16px",
                    boxShadow: `0 8px 20px ${alpha(getStatutConfig(selectedDetenu.statut_juridique).color, 0.4)}`,
                    '&:hover': { 
                      opacity: 0.9, 
                      bgcolor: getStatutConfig(selectedDetenu.statut_juridique).color,
                      boxShadow: `0 12px 25px ${alpha(getStatutConfig(selectedDetenu.statut_juridique).color, 0.6)}`
                    }
                  }}
                >
                  LANCER L'IMPRESSION ({getStatutConfig(selectedDetenu.statut_juridique).label})
                </Button>
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', opacity: isDark ? 0.5 : 1 }}>
                <Security sx={{ fontSize: 120, color: isDark ? '#444' : '#e2e8f0', mb: 2 }} />
                <Typography color="text.secondary" variant="h5" fontWeight="bold">En attente de sélection</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Veuillez rechercher et sélectionner un dossier pour générer sa carte biométrique.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CarteDetenu;