import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Paper, Avatar, Stack, Grid, 
  Chip, Divider, Card, CardContent, List, ListItem, 
  ListItemAvatar, ListItemText, Alert, AlertTitle
} from "@mui/material";
import { 
  Security, History, Share, Warning, Hub, 
  Person, FactCheck, Gavel 
} from "@mui/icons-material";
import axios from "axios";

// Thème Couleurs RDC
const RDC = {
  blue: "#007FFF",
  red: "#CE1021",
  yellow: "#F7D618",
  dark: "#001a33"
};

const IntelligenceDetenu = ({ detenuId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Remplacer par ton URL d'API réelle
        const res = await axios.get(`http://localhost:8000/api/intelligence/${detenuId}/`);
        setData(res.data);
      } catch (err) {
        console.error("Erreur de chargement", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [detenuId]);

  if (loading) return <Typography>Analyse des données en cours...</Typography>;
  if (!data) return <Alert severity="error">Aucune donnée trouvée.</Alert>;

  return (
    <Box sx={{ p: 4, bgcolor: "#F1F5F9", minHeight: "100vh" }}>
      
      {/* BANDEAU SUPÉRIEUR - PROFIL DÉTENU */}
      <Paper elevation={0} sx={{ 
        p: 4, borderRadius: 8, bgcolor: RDC.dark, color: "#FFF", mb: 4,
        borderLeft: `10px solid ${RDC.blue}`, position: 'relative', overflow: 'hidden'
      }}>
        <Box sx={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
          <Gavel sx={{ fontSize: 200 }} />
        </Box>
        
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar sx={{ width: 110, height: 110, bgcolor: RDC.yellow, border: `4px solid ${RDC.blue}` }}>
               <Typography variant="h3" fontWeight={900} color={RDC.blue}>{data.detenu.nom[0]}</Typography>
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: -1 }}>{data.detenu.nom}</Typography>
            <Stack direction="row" spacing={2} mt={1}>
              <Chip label={`MATRICULE: ${data.detenu.matricule}`} sx={{ bgcolor: RDC.blue, color: "#FFF", fontWeight: 800 }} />
              <Chip label="SURVEILLANCE RENFORCÉE" variant="outlined" sx={{ color: RDC.yellow, borderColor: RDC.yellow }} />
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={4}>
        {/* LISTE CHRONOLOGIQUE DES VISITEURS */}
        <Grid item xs={12} lg={7}>
          <Stack direction="row" alignItems="center" spacing={1} mb={3}>
            <History sx={{ color: RDC.blue }} />
            <Typography variant="h5" fontWeight={800}>JOURNAL DES ENTRÉES AU PARLOIR</Typography>
          </Stack>

          <Paper sx={{ borderRadius: 6, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <List disablePadding>
              {data.historique.map((v, index) => (
                <React.Fragment key={v.id}>
                  <ListItem sx={{ p: 3, '&:hover': { bgcolor: '#f8faff' } }}>
                    <ListItemAvatar>
                      <Avatar 
                        src={v.photo_capturee} // Affiche la photo prise à la borne
                        sx={{ width: 64, height: 64, mr: 2, border: `2px solid ${RDC.blue}` }}
                      >
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="h6" fontWeight={800}>{v.nom_complet}</Typography>}
                      secondary={
                        <Stack component="span">
                          <Typography variant="body2" color="textSecondary">
                            Relation: <b>{v.relation}</b> • ID: {v.piece_identite_numero}
                          </Typography>
                          <Typography variant="caption" sx={{ color: RDC.blue, fontWeight: 700 }}>
                            ENTRÉE: {new Date(v.heure_entree).toLocaleString()}
                          </Typography>
                        </Stack>
                      }
                    />
                    <Box textAlign="right">
                        <IconButton><Share sx={{ fontSize: 20 }} /></IconButton>
                        <Typography variant="caption" display="block">Dossier #{v.id}</Typography>
                    </Box>
                  </ListItem>
                  {index < data.historique.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* ANALYSE DES STRATÉGIES ET ALERTES */}
        <Grid item xs={12} lg={5}>
          <Stack direction="row" alignItems="center" spacing={1} mb={3}>
            <Security sx={{ color: RDC.red }} />
            <Typography variant="h5" fontWeight={800}>INTELLIGENCE RÉSEAU</Typography>
          </Stack>

          {data.synthese_securite.length > 0 ? (
            data.synthese_securite.map((alerte, i) => (
              <Card key={i} sx={{ 
                mb: 3, borderRadius: 6, borderLeft: `8px solid ${RDC.red}`,
                boxShadow: '0 10px 30px rgba(206,16,33,0.1)'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} mb={2}>
                    <Avatar sx={{ bgcolor: RDC.red }}><Warning /></Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={900} color={RDC.red}>
                        PIVOT IDENTIFIÉ : {alerte.visiteur}
                      </Typography>
                      <Typography variant="caption" sx={{ letterSpacing: 1 }}>RISQUE : {alerte.niveau_risque}</Typography>
                    </Box>
                  </Stack>
                  
                  <Alert severity="warning" icon={false} sx={{ borderRadius: 4, bgcolor: '#FFF5F5' }}>
                    <AlertTitle sx={{ fontWeight: 800 }}>Détection de liens croisés</AlertTitle>
                    Ce visiteur a également été vu avec les détenus suivants :
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {alerte.detenus_lies.map((nom, j) => (
                        <Chip key={j} label={nom} size="small" sx={{ bgcolor: RDC.dark, color: "#FFF", fontWeight: 700 }} />
                      ))}
                    </Box>
                  </Alert>
                </CardContent>
              </Card>
            ))
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 6, border: '2px dashed #CBD5E1' }}>
              <FactCheck sx={{ fontSize: 50, color: '#CBD5E1', mb: 2 }} />
              <Typography color="textSecondary">Aucune anomalie de réseau détectée pour ce profil.</Typography>
            </Paper>
          )}

          {/* SECTION HUB DE COMMUNICATION */}
          <Paper sx={{ p: 3, mt: 4, borderRadius: 6, bgcolor: RDC.blue, color: "#FFF" }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Hub />
              <Box>
                <Typography fontWeight={800}>STRATÉGIE DE SURVEILLANCE</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Le système croise les données biométriques pour empêcher la communication inter-pavillons.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default IntelligenceDetenu;