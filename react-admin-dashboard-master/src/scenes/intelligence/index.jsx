import React, { useState, useEffect } from "react";
import {
  Box, Typography, useTheme, IconButton, Button, CircularProgress, 
  Table, TableBody, TableCell, TableHead, TableRow, Chip
} from "@mui/material";
import {
  Security, Radar, ErrorOutline, DeviceHub, 
  DownloadOutlined, VerifiedUser, Fingerprint
} from "@mui/icons-material";
import axios from "axios";
import { tokens } from "../../theme";
import { Header, StatBox, LineChart } from "../../components";
import api from "../../api"; // Ton instance Axios centralisée

const IntelligenceANR = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/ia-avance/")
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => console.error("Erreur ANR Data:", err));
  }, []);

  if (loading) return <Box p="20px"><CircularProgress color="secondary" /></Box>;

  return (
    <Box m="20px">
      {/* HEADER TYPE 'INTELLIGENCE REPORT' */}
      <Box display="flex" justifyContent="space-between" alignItems="center" borderBottom={`2px solid ${colors.redAccent[500]}`} pb="10px" mb="20px">
        <Header 
          title="UNITÉ D'ANALYSE IA - SÉCURITÉ D'ÉTAT" 
          subtitle="Surveillance des réseaux de visite et détection d'anomalies (ANR)" 
        />
        <Button
          variant="contained"
          sx={{ bgcolor: colors.redAccent[700], color: "white", fontWeight: "bold" }}
          startIcon={<DownloadOutlined />}
        >
          LOGS DE SÉCURITÉ (SECRET)
        </Button>
      </Box>

      {/* GRILLE TOP : KPIs DE RISQUE */}
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gridAutoRows="140px" gap="20px">
        
        {/* SCORE DE RISQUE CRITIQUE */}
        <Box gridColumn="span 4" bgcolor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" borderLeft={`5px solid ${colors.redAccent[500]}`}>
          <StatBox
            title={data.score_visiteurs.filter(v => v.score > 30).length.toString()}
            subtitle="Visiteurs à Haut Risque"
            progress="0.30"
            increase="Alerte Score"
            icon={<Radar sx={{ color: colors.redAccent[500], fontSize: "32px" }} />}
          />
        </Box>

        {/* USURPATIONS D'IDENTITÉ DÉTECTÉES */}
        <Box gridColumn="span 4" bgcolor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" borderLeft={`5px solid ${colors.blueAccent[500]}`}>
          <StatBox
            title={data.faux_noms.length.toString()}
            subtitle="Anomalies Identité (Faux Noms)"
            progress="1"
            increase="Suspicion d'usurpation"
            icon={<Fingerprint sx={{ color: colors.blueAccent[500], fontSize: "32px" }} />}
          />
        </Box>

        {/* DÉTENUS HAUTE SÉCURITÉ */}
        <Box gridColumn="span 4" bgcolor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" borderLeft={`5px solid ${colors.greenAccent[500]}`}>
          <StatBox
            title="19"
            subtitle="Cibles Haute Sécurité"
            progress="0.10"
            increase="Sous écoute"
            icon={<Security sx={{ color: colors.greenAccent[500], fontSize: "32px" }} />}
          />
        </Box>

        {/* --- SECTION ANALYSE DES IDENTITÉS MULTIPLES (FAUX NOMS) --- */}
        <Box gridColumn="span 6" gridRow="span 3" bgcolor={colors.primary[400]} p="20px" overflow="auto">
          <Typography variant="h5" fontWeight="600" color={colors.redAccent[400]} mb="15px">
             <DeviceHub /> Détection d'Identités Multiples (Cross-matching)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>N° Carte d'Identité</TableCell>
                <TableCell align="center">Alias Détectés</TableCell>
                <TableCell align="center">Total Visites</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.faux_noms.map((row, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ fontSize: '10px', color: colors.blueAccent[300] }}>{row.piece_identite_numero}</TableCell>
                  <TableCell align="center">
                    <Chip label={`${row.noms_differents} Noms`} color="error" variant="outlined" size="small" />
                  </TableCell>
                  <TableCell align="center" fontWeight="bold">{row.total_visites}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box mt="20px" p="10px" bgcolor={colors.redAccent[900]}>
             <Typography variant="caption" color="white">
               NOTE ANR : Une même pièce d'identité utilisée avec plusieurs noms est un indicateur de réseau criminel.
             </Typography>
          </Box>
        </Box>

        {/* --- ANALYSE DES SCORES DE RISQUES (VISITEURS) --- */}
        <Box gridColumn="span 6" gridRow="span 3" bgcolor={colors.primary[400]} p="20px" overflow="auto">
          <Typography variant="h5" fontWeight="600" color={colors.greenAccent[400]} mb="15px">
            <VerifiedUser /> Scoring Individuel des Visiteurs
          </Typography>
          {data.score_visiteurs.map((visiteur, i) => (
            <Box key={i} display="flex" justifyContent="space-between" alignItems="center" borderBottom={`1px solid ${colors.primary[500]}`} p="10px">
              <Box>
                <Typography color={colors.greenAccent[500]} fontWeight="bold">{visiteur.telephone}</Typography>
                <Typography variant="caption">ID: {visiteur.piece_identite_numero.substring(0, 15)}...</Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="h6" color={visiteur.score > 30 ? colors.redAccent[500] : colors.gray[100]}>
                  Score: {visiteur.score}
                </Typography>
                <Typography variant="caption">{visiteur.nombre_visites} visites au total</Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* --- DÉTECTION D'ANOMALIES COMPORTEMENTALES --- */}
        <Box gridColumn="span 12" gridRow="span 2" bgcolor={colors.primary[400]} p="20px">
           <Typography variant="h5" fontWeight="600" color={colors.redAccent[400]} mb="10px">
             <ErrorOutline /> Anomalies de Fréquentation (Heures Suspectes)
           </Typography>
           <Box display="flex" flexWrap="wrap" gap="15px">
             {data.anomalies.map((anom, i) => (
               <Box key={i} p="15px" border={`1px solid ${colors.redAccent[500]}`} borderRadius="4px" minWidth="250px">
                 <Typography color={colors.redAccent[500]} fontWeight="bold">ANOMALIE DÉTECTÉE</Typography>
                 <Typography variant="body2">Tél: {anom.telephone}</Typography>
                 <Typography variant="body2">Heure Entrée: {new Date(anom.heure_entree).toLocaleTimeString()}</Typography>
                 <Typography variant="caption" sx={{ color: colors.gray[300] }}>
                   L'IA a détecté une visite hors des patterns habituels (Score: {anom.anomaly})
                 </Typography>
               </Box>
             ))}
           </Box>
        </Box>

      </Box>
    </Box>
  );
};

export default IntelligenceANR;