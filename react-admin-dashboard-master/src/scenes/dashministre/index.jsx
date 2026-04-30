import React, { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Grid, CircularProgress, Chip, 
  useTheme, alpha, Divider, Button, Avatar, LinearProgress, Card,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert
} from "@mui/material";
import {
  Security, Gavel, FileDownload, TrendingUp, Warning, 
  LocationOn, VerifiedUser, Group, ExitToApp, History, 
  Error, BarChart, PersonSearch, Radar
} from "@mui/icons-material";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import axios from "axios";
import "chart.js/auto";
import api from "../../api";

// Assets
import sceauRdc from "../../assets/gouvernement rdc.png";
import drapeauRdc from "../../assets/rdc.png";

const DashboardMinistreComplet = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  
  const [data, setData] = useState(null);
  const [intel, setIntel] = useState(null); // Nouveau state pour l'intelligence
  const [loading, setLoading] = useState(true);

  const RDC_BLUE = "#007FFF";
  const RDC_YELLOW = "#F7D618";
  const RDC_RED = "#FF3D00";

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Chargement parallèle des deux sources
        const [resDash, resIntel] = await Promise.all([
          api.get("/dashboard/dashboard/"),
          api.get("/dashboard/intelligence/")
        ]);
        setData(resDash.data);
        setIntel(resIntel.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  if (loading || !data || !intel) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ bgcolor: "#020c1b" }}>
      <CircularProgress sx={{ color: RDC_BLUE }} size={70} thickness={2} />
    </Box>
  );

  const { kpis, liberations, evolution, mouvements, infractions, geographie, intelligence } = data;
  const { alertes, top_cibles } = intel;

  // --- CONFIG GRAPHISMES ---
  const evolutionData = {
    labels: evolution.map(e => e.mois),
    datasets: [
      { label: "Entrées", data: evolution.map(e => e.entrees), borderColor: RDC_BLUE, backgroundColor: alpha(RDC_BLUE, 0.2), fill: true, tension: 0.4 },
      { label: "Sorties", data: evolution.map(e => e.sorties), borderColor: RDC_YELLOW, backgroundColor: alpha(RDC_YELLOW, 0.2), fill: true, tension: 0.4 }
    ]
  };

  const infractionsData = {
    labels: infractions.map(i => i.categorie),
    datasets: [{
      label: "Nombre de cas",
      data: infractions.map(i => i.total),
      backgroundColor: [alpha(RDC_BLUE, 0.8), alpha(RDC_RED, 0.8), alpha(RDC_YELLOW, 0.8)],
      borderRadius: 8
    }]
  };

  const statutDoughnut = {
    labels: ["Prévenus", "Dét. Préventifs", "Condamnés", "Libérés", "Décès"],
    datasets: [{
      data: [kpis.statuts.prevenus, kpis.statuts.detenus_preventifs, kpis.statuts.condamnes, kpis.statuts.liberes, kpis.statuts.morts],
      backgroundColor: [RDC_BLUE, RDC_YELLOW, "#4caf50", "#9c27b0", "#000"],
      borderWidth: 0
    }]
  };

  return (
    <Box p={3} sx={{ backgroundColor: isDark ? "#010810" : "#f4f7fe", minHeight: "100vh" }}>
      
      {/* 🏛️ ENTÊTE OFFICIELLE */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} className="no-print">
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar src={sceauRdc} sx={{ width: 70, height: 70 }} />
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ color: isDark ? "#fff" : "#1a1a1a", letterSpacing: -1 }}>
              PORTAIL DE DÉCISION <span style={{ color: RDC_BLUE }}>PÉNITENTIAIRE</span>
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ fontWeight: 600 }}>
              République Démocratique du Congo | Cabinet du Ministre
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={2}>
          <Button 
            variant="contained" 
            startIcon={<FileDownload />} 
            onClick={() => window.print()}
            sx={{ bgcolor: RDC_BLUE, borderRadius: "10px", px: 3, fontWeight: 700 }}
          >
            EXPORTER RAPPORT PDF
          </Button>
          <Avatar src={drapeauRdc} variant="rounded" sx={{ width: 50, height: 35, border: "1px solid #ddd" }} />
        </Box>
      </Box>

      {/* 🚨 ALERTES INTELLIGENCE (Nouveau) */}
      <Box mb={3}>
        {alertes.map((al, idx) => (
          <Alert key={idx} severity="info" sx={{ borderRadius: "15px", fontWeight: 700, border: `1px solid ${RDC_BLUE}` }}>
            {al.message}
          </Alert>
        ))}
      </Box>

      {/* 📊 BARRE DES KPIs MAJEURS */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: "POPULATION ACTIVE", val: kpis.total_actifs, sub: `Sur ${kpis.total_absolu} au total`, icon: <Group />, color: RDC_BLUE },
          { label: "TAUX D'OCCUPATION", val: `${kpis.taux_occupation}%`, sub: "Alerte Surpopulation", icon: <Error />, color: RDC_RED },
          { label: "LIBÉRATIONS (MOIS)", val: liberations.dossiers_termines, sub: `${liberations.taux_completion}% complété`, icon: <ExitToApp />, color: "#4caf50" },
          { label: "BIOMÉTRIE", val: `${kpis.taux_biometrique}%`, sub: "Taux d'enrôlement", icon: <VerifiedUser />, color: RDC_YELLOW },
        ].map((item, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ p: 2, borderRadius: "15px", borderLeft: `5px solid ${item.color}`, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" fontWeight={700} color="textSecondary">{item.label}</Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ my: 0.5 }}>{item.val}</Typography>
                  <Typography variant="caption" color={item.color} sx={{ fontWeight: 600 }}>{item.sub}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha(item.color, 0.1), color: item.color }}>{item.icon}</Avatar>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        
        {/* 🎯 TOP CIBLES INTELLIGENCE (Nouveau) */}
        <Grid item xs={12}>
           <Paper sx={{ p: 2, borderRadius: "20px", display: "flex", alignItems: "center", gap: 3, bgcolor: alpha(RDC_RED, 0.05), border: `1px solid ${alpha(RDC_RED, 0.2)}` }}>
              <Box sx={{ bgcolor: RDC_RED, p: 1, borderRadius: "10px", color: "white" }}><Radar /></Box>
              <Box flexGrow={1}>
                <Typography variant="subtitle2" fontWeight={800} color="error">CIBLE PRIORITAIRE SOUS SURVEILLANCE</Typography>
                <Box display="flex" gap={3} mt={0.5}>
                  {top_cibles.map((cible, idx) => (
                    <Box key={idx} display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" fontWeight={900}>{cible.detenu}</Typography>
                      <Chip label={cible.risque} size="small" color="error" sx={{ fontWeight: 900, fontSize: "0.7rem" }} />
                      <Typography variant="body2" fontWeight={600} color="textSecondary">({cible.visites} visites)</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
           </Paper>
        </Grid>

        {/* 📈 ANALYSE DES FLUX & INFRACTIONS */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: "20px", mb: 3 }}>
            <Typography variant="h6" fontWeight={800} mb={3} display="flex" alignItems="center" gap={1}>
              <TrendingUp color="primary" /> ÉVOLUTION DES MOUVEMENTS (6 MOIS)
            </Typography>
            <Box height={250}>
              <Line data={evolutionData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
            </Box>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: "20px" }}>
            <Typography variant="h6" fontWeight={800} mb={3} display="flex" alignItems="center" gap={1}>
              <BarChart sx={{ color: RDC_YELLOW }} /> RÉPARTITION DES INFRACTIONS
            </Typography>
            <Bar data={infractionsData} options={{ indexAxis: 'y', plugins: { legend: { display: false } } }} />
          </Paper>
        </Grid>

        {/* ⚖️ STATUTS & ÉTAT JURIDIQUE */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: "20px", textAlign: "center", mb: 3 }}>
            <Typography variant="h6" fontWeight={800} mb={2}>SITUATION JURIDIQUE</Typography>
            <Doughnut data={statutDoughnut} options={{ cutout: "70%" }} />
            <Box mt={2}>
              <Grid container spacing={1} textAlign="left">
                <Grid item xs={6}>
                  <Typography variant="caption">Prévenus: <b>{kpis.statuts.prevenus}</b></Typography>
                  <LinearProgress variant="determinate" value={(kpis.statuts.prevenus/kpis.total_actifs)*100} sx={{ height: 6, borderRadius: 5, mb: 1 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption">Condamnés: <b>{kpis.statuts.condamnes}</b></Typography>
                  <LinearProgress variant="determinate" color="success" value={(kpis.statuts.condamnes/kpis.total_actifs)*100} sx={{ height: 6, borderRadius: 5, mb: 1 }} />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="error">Décès: <b>{kpis.statuts.morts}</b></Typography>
                    <Typography variant="caption" color="primary">Libérés: <b>{kpis.statuts.liberes}</b></Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* 🕒 DERNIERS MOUVEMENTS */}
          <Paper sx={{ p: 3, borderRadius: "20px", bgcolor: alpha(RDC_BLUE, 0.02) }}>
            <Typography variant="h6" fontWeight={800} mb={2} display="flex" alignItems="center" gap={1}>
              <History /> FLUX TEMPS RÉEL
            </Typography>
            {mouvements.map((m, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, p: 1.5, bgcolor: "#fff", borderRadius: "10px", border: "1px solid #eee" }}>
                <Avatar sx={{ bgcolor: m.type === "ENTREE" ? alpha(RDC_BLUE, 0.1) : alpha(RDC_YELLOW, 0.1), color: m.type === "ENTREE" ? RDC_BLUE : RDC_YELLOW }}>
                  {m.type === "ENTREE" ? <TrendingUp /> : <ExitToApp />}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={800}>{m.detenu}</Typography>
                  <Typography variant="caption" display="block">{m.type} • {new Date(m.date).toLocaleDateString()}</Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* 🕵️ INTELLIGENCE & GÉOGRAPHIE */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: "20px" }}>
            <Typography variant="h6" fontWeight={800} mb={2} display="flex" alignItems="center" gap={1}>
              <PersonSearch color="error" /> SURVEILLANCE CIBLÉE (IA VISITEURS)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                    <TableCell sx={{ fontWeight: 800 }}>Visiteur</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Cible</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Risque</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Visites</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {intelligence.slice(0, 5).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem" }}>{row.nom}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: RDC_BLUE }}>{row.detenu}</TableCell>
                      <TableCell>
                        <Chip label={row.risque} size="small" sx={{ 
                          fontWeight: 900, fontSize: "0.6rem",
                          bgcolor: row.risque === "MODERE" ? RDC_YELLOW : RDC_RED,
                          color: "#000"
                        }} />
                      </TableCell>
                      <TableCell align="center"><b>{row.visites}</b></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: "20px", height: "100%" }}>
            <Typography variant="h6" fontWeight={800} mb={2} display="flex" alignItems="center" gap={1}>
              <LocationOn sx={{ color: RDC_BLUE }} /> DENSITÉ PAR PROVINCE
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
              {geographie.map((geo, i) => (
                <Box key={i} display="flex" justifyContent="space-between" alignItems="center" p={1.5} sx={{ borderBottom: "1px solid #f0f0f0" }}>
                  <Typography variant="body2" fontWeight={600}>{geo.province}</Typography>
                  <Chip label={`${geo.total} Détenus`} size="small" variant="outlined" sx={{ fontWeight: 800, color: RDC_BLUE, borderColor: RDC_BLUE }} />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

      </Grid>

      {/* STYLE PRINT */}
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; padding: 0 !important; }
            .MuiPaper-root { border: 1px solid #eee !important; box-shadow: none !important; margin-bottom: 20px; }
          }
        `}
      </style>
    </Box>
  );
};

export default DashboardMinistreComplet;