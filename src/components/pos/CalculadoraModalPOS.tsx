import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
} from "@mui/material";

type CalcOperator = "+" | "-" | "*" | "/";

interface CalculadoraModalPOSProps {
  open: boolean;
  onClose: () => void;
  onResult?: (valor: number) => void; // opcional: devolver resultado al POS
}

export const CalculadoraModalPOS: React.FC<CalculadoraModalPOSProps> = ({
  open,
  onClose,
}) => {
  const [display, setDisplay] = useState<string>("0");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<CalcOperator | null>(null);
  const [resetOnNextDigit, setResetOnNextDigit] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      // reset al abrir
      setDisplay("0");
      setPrevValue(null);
      setOperator(null);
      setResetOnNextDigit(false);
    }
  }, [open]);

  const handleDigit = (digit: string) => {
    setDisplay((prev) => {
      if (resetOnNextDigit || prev === "0") {
        setResetOnNextDigit(false);
        return digit;
      }
      if (prev.length >= 9) return prev; // límite simple
      return prev + digit;
    });
  };

  const applyOperation = (
    left: number,
    op: CalcOperator,
    right: number
  ): number => {
    switch (op) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        if (right === 0) return left; // evitar NaN
        return left / right;
      default:
        return right;
    }
  };

  const handleOperatorClick = (op: CalcOperator) => {
    const current = parseFloat(display) || 0;

    if (prevValue === null) {
      setPrevValue(current);
    } else if (operator) {
      const result = applyOperation(prevValue, operator, current);
      setPrevValue(result);
      setDisplay(String(Math.round(result)));
    }

    setOperator(op);
    setResetOnNextDigit(true);
  };

  const handleEquals = () => {
    const current = parseFloat(display) || 0;

    if (prevValue !== null && operator) {
      const result = applyOperation(prevValue, operator, current);
      setDisplay(String(Math.round(result)));
      setPrevValue(null);
      setOperator(null);
      setResetOnNextDigit(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setPrevValue(null);
    setOperator(null);
    setResetOnNextDigit(false);
  };

  const handleBackspace = () => {
    setDisplay((prev) => {
      if (prev.length <= 1) return "0";
      return prev.slice(0, -1);
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Calculadora</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            textAlign: "right",
            mb: 2,
            p: 1.5,
            borderRadius: 1,
            border: "1px solid rgba(0,0,0,0.12)",
            fontSize: 32,
            fontWeight: 700,
            fontFamily: "monospace",
          }}
        >
          {display}
        </Box>

        {/* TECLADO */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
          }}
        >
          {/* fila 1 */}
          <Button variant="outlined" onClick={() => handleDigit("7")}>
            7
          </Button>
          <Button variant="outlined" onClick={() => handleDigit("8")}>
            8
          </Button>
          <Button variant="outlined" onClick={() => handleDigit("9")}>
            9
          </Button>
          <Button variant="contained" onClick={() => handleOperatorClick("/")}>
            ÷
          </Button>

          {/* fila 2 */}
          <Button variant="outlined" onClick={() => handleDigit("4")}>
            4
          </Button>
          <Button variant="outlined" onClick={() => handleDigit("5")}>
            5
          </Button>
          <Button variant="outlined" onClick={() => handleDigit("6")}>
            6
          </Button>
          <Button variant="contained" onClick={() => handleOperatorClick("*")}>
            ×
          </Button>

          {/* fila 3 */}
          <Button variant="outlined" onClick={() => handleDigit("1")}>
            1
          </Button>
          <Button variant="outlined" onClick={() => handleDigit("2")}>
            2
          </Button>
          <Button variant="outlined" onClick={() => handleDigit("3")}>
            3
          </Button>
          <Button variant="contained" onClick={() => handleOperatorClick("-")}>
            −
          </Button>

          {/* fila 4 */}
          <Button variant="outlined" color="warning" onClick={handleClear}>
            C
          </Button>
          <Button variant="outlined" onClick={() => handleDigit("0")}>
            0
          </Button>
          <Button variant="outlined" onClick={handleBackspace}>
            ⌫
          </Button>
          <Button variant="contained" onClick={() => handleOperatorClick("+")}>
            +
          </Button>

          {/* fila 5 */}
          <Button
            variant="contained"
            sx={{ gridColumn: "span 4" }}
            onClick={handleEquals}
          >
            =
          </Button>
        </Box>
      </DialogContent>

      <DialogActions>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ flex: 1, pl: 2 }}
        >
          Usa esta funcion solo para realizar calculos.
        </Typography>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};
