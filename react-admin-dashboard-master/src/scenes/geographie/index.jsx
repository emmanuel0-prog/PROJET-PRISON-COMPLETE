import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Paper, Typography, CircularProgress,
  Chip, useTheme, alpha, Divider, Grid, MenuItem, Select, Button, Avatar, LinearProgress
} from "@mui/material";
import { 
  MapOutlined, SecurityOutlined, PrintOutlined, 
  WarningAmberOutlined, CheckCircleOutline, ErrorOutline 
} from "@mui/icons-material";
import axios from "axios";

// 🗺️ Leaflet & Cartographie
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat"; // 🔥 Heatmap

// 📊 Graphiques
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import api from "../../api";

// 🖼️ Images & Icônes
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import sceauRdc from "../../assets/gouvernement rdc.png"; 
import drapeauRdc from "../../assets/rdc.png";

// 🔥 Fix icônes Leaflet
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// 🎨 Couleurs Gouvernementales / High-Tech
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RED = "#FF3D00";
const GREEN = "#00E676";

// 🧩 Composant enfant pour la Heatmap (Méthode propre React-Leaflet)
const HeatmapLayer = ({ heatData }) => {
  const map = useMap();
  useEffect(() => {
    if (!heatData || heatData.length === 0) return;
    const heatLayer = L.heatLayer(heatData, { radius: 25, blur: 15, maxZoom: 10 }).addTo(map);
    return () => { map.removeLayer(heatLayer); }; // Nettoyage au démontage
  }, [map, heatData]);
  return null;
};

const CartePrisons = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [prisons, setPrisons] = useState([]);
  const [detenus, setDetenus] = useState([]);
  const [province, setProvince] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // 🌍 Fonds de carte
  const mapTileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  // 🔥 FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, dRes] = await Promise.all([
          api.get("/prisons/"),
          api.get("/detenus/")
        ]);
        setPrisons(Array.isArray(pRes.data) ? pRes.data : []);
        setDetenus(Array.isArray(dRes.data) ? dRes.data : []);
      } catch (e) {
        console.error("Erreur API :", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🔥 LISTE DES PROVINCES
  const provinces = [...new Set(prisons.map(p => p.adresse).filter(Boolean))];

  // 🔥 CALCUL STATISTIQUES (useMemo pour optimiser)
  const stats = useMemo(() => {
    return prisons
      .filter(p => province === "ALL" || p.adresse === province)
      .map(p => {
        const nb = detenus.filter(d => d.prison === p.id).length;
        const capacite = p.capacite || 1; // Éviter division par zéro
        const taux = (nb / capacite) * 100;
        
        return {
          ...p,
          nb,
          libre: p.capacite - nb,
          taux
        };
      });
  }, [prisons, detenus, province]);

  // 🔥 DONNÉES HEATMAP
  const heatData = useMemo(() => {
    return stats
      .filter(p => p.latitude && p.longitude)
      .map(p => [Number(p.latitude), Number(p.longitude), p.taux / 100]); // Intensité selon le taux
  }, [stats]);

  // 📊 DONNÉES GRAPHIQUE
  const chartData = {
    labels: stats.map(p => p.nom),
    datasets: [
      {
        label: "Taux d'occupation (%)",
        data: stats.map(p => p.taux),
        backgroundColor: stats.map(p => p.taux > 100 ? RED : p.taux > 80 ? RDC_YELLOW : RDC_BLUE),
        borderRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: alpha(isDark ? '#fff' : '#000', 0.1) } },
      x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45 } }
    }
  };

  // 🖨️ FONCTION IMPRESSION MINISTRE
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: RDC_BLUE }} size={60} />
      </Box>
    );
  }

  return (
    <Box p={3} className="dashboard-container">
      
      {/* 🏛️ HEADER MINISTÉRIEL */}
      <Paper
        elevation={0}
        sx={{
          p: 3, mb: 3, borderRadius: "20px", backdropFilter: "blur(20px)",
          background: isDark ? "linear-gradient(135deg, #0a1929, #020c1b)" : "linear-gradient(135deg, #ffffff, #f5f7fa)",
          border: `1px solid ${alpha(RDC_BLUE, 0.2)}`,
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2
        }}
      >
        <Box display="flex" alignItems="center" gap={3}>
          <Avatar src={sceauRdc} alt="Sceau RDC" sx={{ width: 70, height: 70, bgcolor: 'transparent' }} />
          <Box>
            <Typography variant="h5" fontWeight={900} sx={{ background: `linear-gradient(45deg, ${RDC_BLUE}, ${RDC_YELLOW})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              MINISTÈRE DE LA JUSTICE ET GARDE DES SCEAUX - RDC
            </Typography>
            <Typography variant="subtitle2" fontWeight={700} color="textSecondary" sx={{ letterSpacing: 1 }}>
              CENTRE DE COMMANDEMENT PÉNITENTIAIRE
            </Typography>
          </Box>
          <Avatar src={drapeauRdc} alt="Drapeau RDC" sx={{ width: 50, height: 50, borderRadius: 1 }} />
        </Box>

        <Box display="flex" gap={2} alignItems="center">
          <Chip icon={<SecurityOutlined />} label={`${stats.length} Sites Actifs`} sx={{ bgcolor: alpha(RDC_BLUE, 0.1), color: RDC_BLUE, fontWeight: 800, fontSize: '1rem', py: 2.5 }} />
          <Button variant="contained" startIcon={<PrintOutlined />} onClick={handlePrint} sx={{ bgcolor: RDC_BLUE, color: '#fff', fontWeight: 700, borderRadius: '10px', px: 3, py: 1.5, '&:hover': { bgcolor: '#005bb5' } }}>
            GÉNÉRER LE RAPPORT
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* 🎛️ FILTRES & CARTE */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2, mb: 3, borderRadius: "16px", border: `1px solid ${alpha(RDC_BLUE, 0.1)}` }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography fontWeight={800} variant="h6" display="flex" alignItems="center" gap={1}>
                <MapOutlined color="primary" /> Cartographie Intelligente
              </Typography>
              <Box sx={{ minWidth: 250 }}>
                <Select fullWidth size="small" value={province} onChange={(e) => setProvince(e.target.value)} sx={{ borderRadius: "10px", fontWeight: 700 }}>
                  <MenuItem value="ALL">TOUTES LES PROVINCES</MenuItem>
                  {provinces.map((p, i) => <MenuItem key={i} value={p}>{p}</MenuItem>)}
                </Select>
              </Box>
            </Box>

            {/* 🗺️ MAP CONTAINER */}
            <Box sx={{ height: "600px", borderRadius: "12px", overflow: "hidden", border: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.1)}` }}>
              <MapContainer center={[-4.038, 21.758]} zoom={5} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                <TileLayer url={mapTileUrl} />
                <ZoomControl position="bottomright" />
                <HeatmapLayer heatData={heatData} />

                <MarkerClusterGroup>
                  {stats.filter(p => p.latitude && p.longitude).map((p, index) => (
                    <Marker key={p.id || index} position={[Number(p.latitude), Number(p.longitude)]}>
                      <Popup>
                        <Box sx={{ minWidth: 220, p: 1 }}>
                          <Typography fontWeight={900} color={p.taux > 100 ? RED : RDC_BLUE} mb={1} variant="subtitle1">
                            {p.nom}
                          </Typography>
                          <Divider sx={{ mb: 1.5 }} />
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" color="textSecondary">Détenus :</Typography>
                            <Typography variant="body2" fontWeight={800}>{p.nb}</Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" color="textSecondary">Capacité :</Typography>
                            <Typography variant="body2" fontWeight={800}>{p.capacite}</Typography>
                          </Box>
                          
                          <Box mt={1.5}>
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                              <Typography variant="caption" fontWeight={700}>Occupation</Typography>
                              <Typography variant="caption" fontWeight={900} color={p.taux > 100 ? RED : "inherit"}>
                                {p.taux.toFixed(1)}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.min(p.taux, 100)} 
                              sx={{ height: 8, borderRadius: 4, bgcolor: alpha(isDark ? '#fff' : '#000', 0.1), '& .MuiLinearProgress-bar': { bgcolor: p.taux > 100 ? RED : p.taux > 80 ? RDC_YELLOW : GREEN } }}
                            />
                          </Box>
                        </Box>
                      </Popup>
                    </Marker>
                  ))}
                </MarkerClusterGroup>
              </MapContainer>
            </Box>
          </Paper>
        </Grid>

        {/* 📊 GRAPHIQUES ET RAPPORT IA */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, mb: 3, borderRadius: "16px", border: `1px solid ${alpha(RDC_BLUE, 0.1)}` }}>
            <Typography fontWeight={900} mb={2}>📊 Analyse d'Occupation</Typography>
            <Box height={250}>
              <Bar data={chartData} options={chartOptions} />
            </Box>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: "16px", border: `1px solid ${alpha(RDC_BLUE, 0.1)}`, maxHeight: "380px", overflowY: "auto" }}>
            <Typography fontWeight={900} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📝 Synthèse IA (Alertes)
            </Typography>

            {stats.sort((a, b) => b.taux - a.taux).map(p => (
              <Box key={p.id} mb={2} p={1.5} sx={{ bgcolor: alpha(p.taux > 100 ? RED : p.taux > 80 ? RDC_YELLOW : GREEN, 0.05), borderRadius: "8px", borderLeft: `4px solid ${p.taux > 100 ? RED : p.taux > 80 ? RDC_YELLOW : GREEN}` }}>
                <Typography fontWeight={800} variant="subtitle2">{p.nom}</Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  {p.taux > 100 ? <ErrorOutline sx={{ color: RED, fontSize: 18 }} /> 
                    : p.taux > 80 ? <WarningAmberOutlined sx={{ color: RDC_YELLOW, fontSize: 18 }} /> 
                    : <CheckCircleOutline sx={{ color: GREEN, fontSize: 18 }} />}
                  <Typography variant="caption" fontWeight={600} color={p.taux > 100 ? RED : p.taux > 80 ? 'textSecondary' : GREEN}>
                    {p.taux > 100 ? `SURPOPULATION CRITIQUE (${p.taux.toFixed(0)}%)` 
                      : p.taux > 80 ? `Tension observée (${p.taux.toFixed(0)}%)` 
                      : `Capacité maîtrisée (${p.taux.toFixed(0)}%)`}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CartePrisons;