import {
  Box,
  Typography,
  useTheme,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { Header } from "../../components";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

const detenus = [
  {
    id: 1,
    matricule: "DET-001",
    nom: "KABONGO",
    postnom: "MUTOMBO",
    prenom: "Jean",
    sexe: "M",
    prison: "Prison Centrale de Makala",
    statut: "Prévenu",
  },
  {
    id: 2,
    matricule: "DET-002",
    nom: "LUKUSA",
    postnom: "KASONGO",
    prenom: "Pauline",
    sexe: "F",
    prison: "Prison de Ndolo",
    statut: "Condamné",
  },
  {
    id: 3,
    matricule: "DET-003",
    nom: "MWAMBA",
    postnom: "KALALA",
    prenom: "Patrick",
    sexe: "M",
    prison: "Prison Centrale de Makala",
    statut: "Condamné",
  },
];

const Detenus = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const columns = [
    { field: "matricule", headerName: "Matricule", flex: 1 },
    { field: "nom", headerName: "Nom", flex: 1 },
    { field: "postnom", headerName: "Post-nom", flex: 1 },
    { field: "prenom", headerName: "Prénom", flex: 1 },
    { field: "sexe", headerName: "Sexe", flex: 0.5 },
    { field: "prison", headerName: "Prison", flex: 2 },
    { field: "statut", headerName: "Statut juridique", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.5,
      renderCell: () => (
        <IconButton>
          <VisibilityOutlinedIcon color="primary" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header
        title="Liste des Détenus"
        subtitle="Gestion nationale des détenus – RDC"
      />

      <Box
        m="40px 0 0 0"
        height="70vh"
        sx={{
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            backgroundColor: colors.blueAccent[700],
            borderTop: "none",
          },
        }}
      >
        <DataGrid
          rows={detenus}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </Box>
    </Box>
  );
};

export default Detenus;
