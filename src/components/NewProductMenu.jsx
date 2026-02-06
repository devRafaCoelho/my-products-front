import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import {
  Edit as EditIcon,
  QrCodeScanner as QrCodeScannerIcon,
} from "@mui/icons-material";

function NewProductMenu({
  anchorEl,
  onClose,
  onManualCreate,
  onScanReceipt,
  anchorOrigin = {
    vertical: "bottom",
    horizontal: "right",
  },
  transformOrigin = {
    vertical: "top",
    horizontal: "right",
  },
}) {
  const handleManualCreate = () => {
    onClose();
    onManualCreate();
  };

  const handleScanReceipt = () => {
    onClose();
    if (onScanReceipt) {
      onScanReceipt();
    }
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
    >
      <MenuItem onClick={handleManualCreate}>
        <ListItemIcon>
          <EditIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Cadastrar manual</ListItemText>
      </MenuItem>
      <MenuItem onClick={handleScanReceipt}>
        <ListItemIcon>
          <QrCodeScannerIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Escanear nota</ListItemText>
      </MenuItem>
    </Menu>
  );
}

export default NewProductMenu;
