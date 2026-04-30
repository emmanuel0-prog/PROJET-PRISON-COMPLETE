import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Stack, IconButton, Tooltip, Paper, alpha } from "@mui/material";
import { DataGrid, frFR } from "@mui/x-data-grid";
import { RestoreFromTrash, DeleteForever, ArrowBack, WarningAmber } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RDC_BLUE = "#007FFF";
const RDC_RED = "#CE1021";
import api from "../../api"; // ✅ API CENTRALISÉE

const Corbeille = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. Charger les données
  const fetchCorbeille = async () => {
    try {
      const response = await api.get("/detenus/corbeille/");
      setRows(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur chargement corbeille:", error);
      setLoading(false);
    }
  };

  useEffect(() => { fetchCorbeille(); }, []);

  // 2. Action de Restauration (Mise à jour vers registre actif)
  const handleRestore = async (id) => {
    if (window.confirm("Voulez-vous restaurer ce dossier dans le registre actif ?")) {
      try {
        await api.post(`/detenus/${id}/restaurer/`);
        setRows(rows.filter(r => r.id !== id)); // Enlever de la vue locale
      } catch (error) {
        alert("Erreur lors de la restauration.");
      }
    }
  };

  // 3. Action de Purge Définitive (Suppression physique BDD)
  const handlePurge = async (id) => {
    const confirmation = window.confirm(
      "ATTENTION : Cette action est IRREVERSIBLE. Le dossier sera définitivement effacé du serveur. Continuer ?"
    );
    
    if (confirmation) {
      try {
        // Appel de la nouvelle route personnalisée "purger"
        await api.delete(`/api/detenus/${id}/purger/`);
        setRows(rows.filter(r => r.id !== id));
      } catch (error) {
        console.error("Erreur purge:", error);
        alert("Erreur lors de la suppression définitive.");
      }
    }
  };

  const columns = [
    { 
      field: "matricule", 
      headerName: "N° ÉCROU", 
      width: 120,
      renderCell: (params) => <Typography fontWeight={900}>{params.value}</Typography>
    },
    { 
      field: "nom", 
      headerName: "NOM COMPLET", 
      flex: 1, 
      valueGetter: (params) => `${params.row.nom} ${params.row.postnom} ${params.row.prenom || ""}`.toUpperCase() 
    },
    { 
      field: "date_suppression", 
      headerName: "DATE DE MISE EN ARCHIVE", 
      width: 250, 
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontStyle: "italic" }}>
          {params.value ? new Date(params.value).toLocaleString('fr-FR') : "N/A"}
        </Typography>
      )
    },
    {
      field: "actions",
      headerName: "RESTAURATION / PURGE",
      width: 200,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Stack direction="row" spacing={2}>
          <Tooltip title="Restaurer le dossier">
            <IconButton 
              onClick={() => handleRestore(params.row.id)} 
              sx={{ color: RDC_BLUE, bgcolor: alpha(RDC_BLUE, 0.1), "&:hover": { bgcolor: RDC_BLUE, color: "#fff" } }}
            >
              <RestoreFromTrash />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="SUPPRIMER DÉFINITIVEMENT">
            <IconButton 
              onClick={() => handlePurge(params.row.id)} 
              sx={{ color: RDC_RED, bgcolor: alpha(RDC_RED, 0.1), "&:hover": { bgcolor: RDC_RED, color: "#fff" } }}
            >
              <DeleteForever />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box m="20px">
      {/* HEADER */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => navigate("/detenus/liste")} 
            sx={{ mb: 1, fontWeight: 900, color: "#666" }}
          >
            Retour au registre
          </Button>
          <Typography variant="h4" fontWeight={900} color={RDC_RED}>
            CORBEILLE DES DOSSIERS
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1, color: "#666" }}>
            <WarningAmber sx={{ fontSize: 16 }} /> Zone de haute sécurité : Les suppressions ici sont définitives.
          </Typography>
        </Box>
      </Stack>

      {/* TABLEAU */}
      <Paper sx={{ 
        height: "70vh", 
        width: "100%", 
        borderRadius: 0, 
        border: `2px solid ${RDC_RED}`,
        boxShadow: "none"
      }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
          sx={{
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: RDC_RED,
              color: "#fff",
              borderRadius: 0,
              fontWeight: 900
            },
            "& .MuiDataGrid-cell": {
              borderBottom: `1px solid ${alpha(RDC_RED, 0.1)}`,
              fontWeight: 700
            }
          }}
        />
      </Paper>
    </Box>
  );
};

export default Corbeille;