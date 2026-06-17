"use client"

import Link from "next/link"
import styled from "styled-components"

const Page = styled.main`
  min-height: 100vh;
  padding: 28px;
`

const Layout = styled.div`
  width: min(1240px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 22px;
`

const Hero = styled.section`
  display: grid;
  gap: 22px;
  grid-template-columns: repeat(12, minmax(0, 1fr));

  > * {
    grid-column: span 12;
  }

  @media (min-width: 960px) {
    > :first-child {
      grid-column: span 8;
    }

    > :last-child {
      grid-column: span 4;
    }
  }
`

const Statement = styled.article`
  position: relative;
  overflow: hidden;
  padding: clamp(28px, 5vw, 54px);
  border-radius: 34px;
  background:
    radial-gradient(circle at top right, rgba(255, 208, 163, 0.22), transparent 30%),
    linear-gradient(135deg, #111111 0%, #1d1c1a 38%, #5b341f 100%);
  color: #f8f1e8;
  box-shadow: 0 34px 70px rgba(57, 32, 16, 0.24);
`

const AccentLine = styled.div`
  width: 120px;
  height: 6px;
  margin-bottom: 24px;
  border-radius: 999px;
  background: linear-gradient(90deg, #ffb36b, #ffe1c0);
`

const Eyebrow = styled.span`
  display: inline-flex;
  margin-bottom: 16px;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: rgba(248, 241, 232, 0.72);
`

const Title = styled.h1`
  max-width: 760px;
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(3.4rem, 7vw, 6.2rem);
  line-height: 0.9;
  letter-spacing: -0.05em;
`

const Lead = styled.p`
  max-width: 680px;
  margin: 22px 0 0;
  color: rgba(248, 241, 232, 0.82);
  font-size: 1.02rem;
  line-height: 1.8;
`

const Actions = styled.div`
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 30px;
`

const PrimaryLink = styled(Link)`
  display: inline-flex;
  padding: 14px 22px;
  border-radius: 999px;
  background: #f8f1e8;
  color: #171411;
  font-weight: 800;
`

const SecondaryLink = styled(Link)`
  display: inline-flex;
  padding: 14px 22px;
  border-radius: 999px;
  border: 1px solid rgba(248, 241, 232, 0.18);
  color: #f8f1e8;
  font-weight: 800;
`

const SidePanel = styled.aside`
  display: grid;
  gap: 18px;
`

const SideCard = styled.article`
  padding: 24px;
  border-radius: 28px;
  background: rgba(255, 252, 247, 0.78);
  border: 1px solid rgba(71, 55, 36, 0.12);
  box-shadow: 0 18px 36px rgba(57, 32, 16, 0.1);
`

const Kicker = styled.span`
  display: block;
  margin-bottom: 10px;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--text-soft);
`

const Number = styled.strong`
  display: block;
  font-size: 2.6rem;
  line-height: 1;
`

const SideText = styled.p`
  margin: 12px 0 0;
  color: var(--text-soft);
  line-height: 1.6;
`

const Rail = styled.section`
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
`

const RailCard = styled.article`
  min-height: 220px;
  padding: 24px;
  border-radius: 28px;
  background: rgba(255, 252, 247, 0.76);
  border: 1px solid rgba(71, 55, 36, 0.1);
  box-shadow: 0 18px 36px rgba(57, 32, 16, 0.08);
`

const Index = styled.span`
  display: inline-flex;
  margin-bottom: 22px;
  font-size: 0.86rem;
  font-weight: 800;
  color: var(--accent-strong);
`

const CardTitle = styled.h2`
  margin: 0 0 10px;
  font-size: 1.24rem;
`

const CardText = styled.p`
  margin: 0;
  color: var(--text-soft);
  line-height: 1.7;
`

const FooterStrip = styled.section`
  display: none;
`

export default function HomePage(): JSX.Element {
  return (
    <Page>
      <Layout>
        <Hero>
          <Statement>
            <AccentLine />
            <Eyebrow>Payments reconciliation module</Eyebrow>
            <Title>Prueba  Jorge Moraga</Title>
            
            <Actions>
              <PrimaryLink href="/tasks">Abrir hub operativo</PrimaryLink>
              <SecondaryLink href="/tasks/bank-movements">Conciliar transferencias</SecondaryLink>
            </Actions>
          </Statement>

          <SidePanel>
            <SideCard>
              <Kicker>Moneda UF</Kicker>
              <Number>$40.000</Number>
              <SideText>
                Valor fijo visible desde la entrada para dejar claro el criterio de conversion
                antes de empezar a operar.
              </SideText>
            </SideCard>
            <SideCard>
              <Kicker>Ruta</Kicker>
              <Number>Hub</Number>
              <SideText>
                Entra al hub y salta directo al modulo que te falte. Si ya tienes cobros cargados,
                ve a movimientos. Si quieres auditar, abre el historico.
              </SideText>
            </SideCard>
          </SidePanel>
        </Hero>

        <Rail>
          <RailCard>
            <Index>01</Index>
            <CardTitle>Construye el universo de cobros</CardTitle>
            <CardText>
              Registra collections en CLP o UF y convierte cada fila en una pieza legible del
              calendario financiero.
            </CardText>
          </RailCard>
          <RailCard>
            <Index>02</Index>
            <CardTitle>Parte desde la transferencia</CardTitle>
            <CardText>
              Toma un movimiento real, mira su saldo libre y distribuye el abono sin perder
              control sobre el remanente.
            </CardText>
          </RailCard>
          <RailCard>
            <Index>03</Index>
            <CardTitle>Deja trazabilidad util</CardTitle>
            <CardText>
              El historico ya no es una tabla muda: muestra pagos parciales, estados y detalle
              explicable por contrato.
            </CardText>
          </RailCard>
        </Rail>
      </Layout>
    </Page>
  )
}
