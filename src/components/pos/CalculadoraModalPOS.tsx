import React, { useState, useEffect, useRef } from "react";
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
  onResult?: (valor: number) => void; // (si luego quieres usarlo)
}

export const CalculadoraModalPOS: React.FC<CalculadoraModalPOSProps> = ({
  open,
  onClose,
}) => {
  const [display, setDisplay] = useState<string>("0");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<CalcOperator | null>(null);
  const [resetOnNextDigit, setResetOnNextDigit] = useState<boolean>(false);

  // Refs para que el teclado siempre use el estado más reciente (sin “stale closures”)
  const displayRef = useRef(display);
  const prevValueRef = useRef(prevValue);
  const operatorRef = useRef(operator);
  const resetRef = useRef(resetOnNextDigit);

  useEffect(() => void (displayRef.current = display), [display]);
  useEffect(() => void (prevValueRef.current = prevValue), [prevValue]);
  useEffect(() => void (operatorRef.current = operator), [operator]);
  useEffect(() => void (resetRef.current = resetOnNextDigit), [resetOnNextDigit]);

  useEffect(() => {
    if (open) {
      // reset al abrir
      setDisplay("0");
      setPrevValue(null);
      setOperator(null);
      setResetOnNextDigit(false);

      displayRef.current = "0";
      prevValueRef.current = null;
      operatorRef.current = null;
      resetRef.current = false;
    }
  }, [open]);

  const applyOperation = (left: number, op: CalcOperator, right: number): number => {
    switch (op) {
      case "+": return left + right;
      case "-": return left - right;
      case "*": return left * right;
      case "/": return right === 0 ? left : left / right;
    }
  };

  const handleDigit = (digit: string) => {
    setDisplay((prev) => {
      const shouldReset = resetRef.current;
      let next = prev;

      if (shouldReset || prev === "0") {
        next = digit;
        resetRef.current = false;
        setResetOnNextDigit(false);
      } else {
        if (prev.length >= 9) return prev;
        next = prev + digit;
      }

      displayRef.current = next;
      return next;
    });
  };

  const handleOperatorClick = (op: CalcOperator) => {
    const current = parseFloat(displayRef.current) || 0;

    if (prevValueRef.current === null) {
      prevValueRef.current = current;
      setPrevValue(current);
    } else if (operatorRef.current) {
      const result = applyOperation(prevValueRef.current, operatorRef.current, current);
      prevValueRef.current = result;
      setPrevValue(result);

      const shown = String(Math.round(result));
      displayRef.current = shown;
      setDisplay(shown);
    }

    operatorRef.current = op;
    setOperator(op);

    resetRef.current = true;
    setResetOnNextDigit(true);
  };

  const handleEquals = () => {
    const current = parseFloat(displayRef.current) || 0;

    if (prevValueRef.current !== null && operatorRef.current) {
      const result = applyOperation(prevValueRef.current, operatorRef.current, current);
      const shown = String(Math.round(result));

      displayRef.current = shown;
      setDisplay(shown);

      prevValueRef.current = null;
      operatorRef.current = null;
      setPrevValue(null);
      setOperator(null);

      resetRef.current = true;
      setResetOnNextDigit(true);
    }
  };

  const handleClear = () => {
    displayRef.current = "0";
    prevValueRef.current = null;
    operatorRef.current = null;
    resetRef.current = false;

    setDisplay("0");
    setPrevValue(null);
    setOperator(null);
    setResetOnNextDigit(false);
  };

  const handleBackspace = () => {
    setDisplay((prev) => {
      let next = prev;
      if (prev.length <= 1) next = "0";
      else next = prev.slice(0, -1);

      displayRef.current = next;
      return next;
    });
  };

  // ✅ Soporte teclado físico / numpad
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key;

      if (k === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (k === "Enter" || k === "=") {
        e.preventDefault();
        handleEquals();
        return;
      }

      if (k === "Backspace") {
        e.preventDefault();
        handleBackspace();
        return;
      }

      if (k === "c" || k === "C") {
        e.preventDefault();
        handleClear();
        return;
      }

      if (/^\d$/.test(k)) {
        e.preventDefault();
        handleDigit(k);
        return;
      }

      // operadores (incluye keypad)
      if (k === "+" || k === "-" || k === "*" || k === "/") {
        e.preventDefault();
        handleOperatorClick(k as CalcOperator);
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, onClose]);

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

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>
          <Button variant="outlined" onClick={() => handleDigit("7")}>7</Button>
          <Button variant="outlined" onClick={() => handleDigit("8")}>8</Button>
          <Button variant="outlined" onClick={() => handleDigit("9")}>9</Button>
          <Button variant="contained" onClick={() => handleOperatorClick("/")}>÷</Button>

          <Button variant="outlined" onClick={() => handleDigit("4")}>4</Button>
          <Button variant="outlined" onClick={() => handleDigit("5")}>5</Button>
          <Button variant="outlined" onClick={() => handleDigit("6")}>6</Button>
          <Button variant="contained" onClick={() => handleOperatorClick("*")}>×</Button>

          <Button variant="outlined" onClick={() => handleDigit("1")}>1</Button>
          <Button variant="outlined" onClick={() => handleDigit("2")}>2</Button>
          <Button variant="outlined" onClick={() => handleDigit("3")}>3</Button>
          <Button variant="contained" onClick={() => handleOperatorClick("-")}>−</Button>

          <Button variant="outlined" color="warning" onClick={handleClear}>C</Button>
          <Button variant="outlined" onClick={() => handleDigit("0")}>0</Button>
          <Button variant="outlined" onClick={handleBackspace}>⌫</Button>
          <Button variant="contained" onClick={() => handleOperatorClick("+")}>+</Button>

          <Button variant="contained" sx={{ gridColumn: "span 4" }} onClick={handleEquals}>
            =
          </Button>
        </Box>
      </DialogContent>

      <DialogActions>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1, pl: 2 }}>
          Tip: teclado numérico · Enter/= = resultado · Esc = cerrar
        </Typography>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};
