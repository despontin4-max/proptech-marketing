import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: '30pt 42.5pt 20pt 42.5pt',
    fontFamily: 'Helvetica',
  },
  pageContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cuerpo: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 14,
  },
  topHeaderBanner: {
    width: '100%',
    height: 110,
    marginBottom: 2,
  },
  separator: {
    borderBottom: '1pt dashed #aaaaaa',
    marginVertical: 6,
    width: '100%',
  },
  orangeBanner: {
    backgroundColor: '#eb8226',
    color: '#ffffff',
    padding: '3.5pt 10pt',
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  orangeBannerTitle: {
    fontSize: 13.5,
    fontWeight: 'bold',
  },
  soliContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soliLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 6,
    color: '#ffffff',
  },
  soliBox: {
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '1pt solid #eb8226',
    padding: '2pt 12pt',
    borderRadius: 3,
    fontSize: 12.5,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  gridBox: {
    border: '1.5pt solid #eb8226',
    borderRadius: 5,
    padding: '3.5pt 7pt',
    backgroundColor: '#ffffff',
  },
  boxLabel: {
    fontSize: 8.5,
    color: '#0099d8',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2.5,
  },
  boxVal: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  phoneVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
    lineHeight: 1.15,
  },
  noticeSection: {
    fontSize: 8.5,
    color: '#000000',
    lineHeight: 1.25,
    marginTop: 2,
  },
  historyLine: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 3,
  },
  importeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  importeBox: {
    border: '1.5pt solid #eb8226',
    borderRadius: 5,
    width: 160,
    textAlign: 'center',
  },
  importeHeader: {
    backgroundColor: '#ffffff',
    color: '#0099d8',
    fontSize: 8.5,
    fontWeight: 'bold',
    padding: '2pt 0',
    borderBottom: '1.5pt solid #eb8226',
  },
  importVal: {
    fontSize: 14.5,
    fontWeight: 'bold',
    padding: '3pt 0',
    color: '#000000',
  }
});

export const ReciboPDF = ({ clientData, headerBase64 }: { clientData: any, headerBase64: string }) => {
  const codPadded = String(clientData.cod || 0).padStart(6, '0');
  const soliPadded = String(clientData.soli || 0).padStart(5, '0');
  
  const rawPhone = String(clientData.phone || '').trim();
  const phoneLines = rawPhone.split(/[\/\n]+/).map(p => p.trim()).filter(p => p.length > 0);
  
  const rawAmount = String(clientData.amount || '0,00').trim();
  const formattedAmount = rawAmount.startsWith('$') ? rawAmount : `$ ${rawAmount}`;

  const renderCuerpo = (type: 'top' | 'middle' | 'bottom') => {
    const isTop = type === 'top';
    const isLast = type === 'bottom';

    let nombreLabel = `NOMBRE Y APELLIDO ( ${codPadded} ) / 001`;
    if (type === 'middle') {
      nombreLabel = 'NOMBRE Y APELLIDO';
    } else if (type === 'bottom') {
      nombreLabel = `NOMBRE Y APELLIDO ( ${codPadded} )`;
    }

    return (
      <View style={styles.cuerpo} wrap={false}>
        {isTop && (
          <View style={styles.topHeaderBanner}>
            {headerBase64 ? (
              <Image src={headerBase64} style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
            ) : (
              <View style={{ backgroundColor: '#eb8226', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>AUTOHOGAR</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.orangeBanner}>
          <Text style={styles.orangeBannerTitle}>AVISO VENCIMIENTO DE ANTICIPO</Text>
          <View style={styles.soliContainer}>
            <Text style={styles.soliLabel}>Nº</Text>
            <View style={styles.soliBox}>
              <Text>{soliPadded}</Text>
            </View>
          </View>
        </View>

        {/* Two-column layout: Left (73%) has Rows 1 & 2; Right (26%) has DIRECCIÓN spanning full height */}
        <View style={{ flexDirection: 'row', width: '100%', marginBottom: 3 }}>
          {/* Left Column (73%) */}
          <View style={{ width: '73%', marginRight: '1%' }}>
            {/* Row 1: Nombre y Apellido (68%) + DNI (30%) */}
            <View style={{ flexDirection: 'row', width: '100%', marginBottom: 3 }}>
              <View style={[styles.gridBox, { width: '68%', marginRight: '2%' }]}>
                <Text style={styles.boxLabel}>{nombreLabel}</Text>
                <Text style={styles.boxVal}>{clientData.name || ''}</Text>
              </View>
              <View style={[styles.gridBox, { width: '30%' }]}>
                <Text style={styles.boxLabel}>D.N.I.</Text>
                <Text style={styles.boxVal}>{clientData.dni || ''}</Text>
              </View>
            </View>

            {/* Row 2: Producto Solicitado (68%) + Anticipo/Vencimiento (30%) */}
            <View style={{ flexDirection: 'row', width: '100%' }}>
              <View style={[styles.gridBox, { width: '68%', marginRight: '2%' }]}>
                <Text style={styles.boxLabel}>PRODUCTO SOLICITADO</Text>
                <Text style={styles.boxVal}>{clientData.plan || ''}</Text>
              </View>
              <View style={[styles.gridBox, { width: '30%' }]}>
                <Text style={[styles.boxLabel, { fontSize: 7.5 }]}>ANTICIPO - VENCIMIENTO</Text>
                <Text style={styles.boxVal}>{clientData.cuotaNum || ''} - {clientData.dueDate || ''}</Text>
              </View>
            </View>
          </View>

          {/* Right Column (26%): DIRECCIÓN spanning both rows with ample vertical room */}
          <View style={[styles.gridBox, { width: '26%', justifyContent: 'space-between' }]}>
            <View>
              <Text style={styles.boxLabel}>DIRECCIÓN</Text>
              <Text style={[styles.boxVal, { fontSize: 9.5, lineHeight: 1.15 }]}>{clientData.address || ''}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              {clientData.city && clientData.city.trim().toUpperCase() !== (clientData.province || 'SAN JUAN').trim().toUpperCase() ? (
                <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#000000', textTransform: 'uppercase' }}>
                  {String(clientData.city || '').split(' ')[0]}
                </Text>
              ) : (
                <View />
              )}
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#000000', textTransform: 'uppercase' }}>
                {clientData.province || 'SAN JUAN'}
              </Text>
            </View>
          </View>
        </View>

        {/* Row 3: TELÉFONO aligned to the right (26% width) under DIRECCIÓN */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%', marginBottom: 3 }}>
          <View style={[styles.gridBox, { width: '26%' }]}>
            <Text style={styles.boxLabel}>TELÉFONO</Text>
            {phoneLines.length > 0 ? (
              phoneLines.map((line, idx) => (
                <Text key={idx} style={styles.phoneVal}>{line}</Text>
              ))
            ) : (
              <Text style={styles.phoneVal}>{rawPhone || '-'}</Text>
            )}
          </View>
        </View>

        {/* Bottom line: Notice on Left (or History line in bottom receipt), IMPORTE ABONADO on Right */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View style={{ width: '64%' }}>
            {isTop ? (
              <View style={styles.noticeSection}>
                <Text style={{ fontWeight: 'bold' }}>Señor Cliente: Se informa que los unicos medios de pago habilitados son los siguientes:</Text>
                <Text>-Deposito o transferencia bancaria.</Text>
                <Text>-Sucursales habilitadas para el cobro.</Text>
                <Text>-Pago al cobrador que envia la compañia a su domicilio quien entregara como constancia el comprobante correspondiente</Text>
              </View>
            ) : isLast && clientData.history ? (
              <Text style={styles.historyLine}>{clientData.history}</Text>
            ) : (
              <View />
            )}
          </View>
          
          <View style={styles.importeContainer}>
            <View style={styles.importeBox}>
              <View style={styles.importeHeader}><Text>IMPORTE ABONADO</Text></View>
              <View style={styles.importVal}><Text>{formattedAmount}</Text></View>
            </View>
          </View>
        </View>

        {!isLast && <View style={styles.separator} />}
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.pageContainer}>
          {renderCuerpo('top')}
          {renderCuerpo('middle')}
          {renderCuerpo('bottom')}
        </View>
      </Page>
    </Document>
  );
};


