"use client"

import styled from "styled-components"

const Wrapper = styled.main`
  max-width: 760px;
  margin: 0 auto;
  padding: 2rem 1rem;
`

const Title = styled.h1`
  margin: 0 0 1rem;
`

const Text = styled.p`
  margin: 0.5rem 0;
  line-height: 1.5;
`

export default function TasksPage(): JSX.Element {
  return (
    <Wrapper>
      <Title>Prueba tecnica: proyectos, ingresos y gastos</Title>
      <Text>
        Esta pantalla se entrega sin implementacion funcional.
      </Text>
      <Text>
        Implementa desde cero la interfaz conectada a la API del backend segun el README,
        incluyendo CRUD de movimientos (ingreso/egreso) y el boton de balance neto mensual con
        impuesto 19%.
      </Text>
    </Wrapper>
  )
}
