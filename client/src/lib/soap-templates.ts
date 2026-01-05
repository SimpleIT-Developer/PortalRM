
import { BorderoItem } from "@/pages/aprovacao-bordero-columns";

export const getAprovacaoBorderoSoap = (item: BorderoItem, username: string) => {
  const executionId = crypto.randomUUID();
  
  // Formatar data no estilo .NET/RM: YYYY-MM-DDTHH:mm:ss.sssssss-03:00
  // Para simplificar e evitar problemas de timezone do navegador, vamos construir manualmente
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  // Hardcoded timezone offset -03:00 (Brasília) pois o RM geralmente espera isso ou local
  const scheduleDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.0000000-03:00`;
  const todayDate = `${year}-${month}-${day}T00:00:00-03:00`;

  // Construct the inner XML for strXmlParams
  // We need to be careful with the structure and namespaces
  const innerXml = `<FinBorderoAutzParamsProc z:Id="i1" xmlns="http://www.totvs.com.br/RM/" xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns:z="http://schemas.microsoft.com/2003/10/Serialization/">
  <ActionModule xmlns="http://www.totvs.com/">F</ActionModule>
  <ActionName xmlns="http://www.totvs.com/">FinBorderoAutzActionProc</ActionName>
  <CanParallelize xmlns="http://www.totvs.com/">true</CanParallelize>
  <CanSendMail xmlns="http://www.totvs.com/">false</CanSendMail>
  <CanWaitSchedule xmlns="http://www.totvs.com/">false</CanWaitSchedule>
  <CodUsuario xmlns="http://www.totvs.com/">${username}</CodUsuario>
  <ConnectionId i:nil="true" xmlns="http://www.totvs.com/" />
  <ConnectionString i:nil="true" xmlns="http://www.totvs.com/" />
  <Context z:Id="i2" xmlns="http://www.totvs.com/" xmlns:a="http://www.totvs.com.br/RM/">
    <a:_params xmlns:b="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$EXERCICIOFISCAL</b:Key>
        <b:Value i:type="c:int" xmlns:c="http://www.w3.org/2001/XMLSchema">22</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODLOCPRT</b:Key>
        <b:Value i:type="c:int" xmlns:c="http://www.w3.org/2001/XMLSchema">-1</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODTIPOCURSO</b:Key>
        <b:Value i:type="c:int" xmlns:c="http://www.w3.org/2001/XMLSchema">1</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$EDUTIPOUSR</b:Key>
        <b:Value i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">-1</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODUNIDADEBIB</b:Key>
        <b:Value i:type="c:int" xmlns:c="http://www.w3.org/2001/XMLSchema">1</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODCOLIGADA</b:Key>
        <b:Value i:type="c:int" xmlns:c="http://www.w3.org/2001/XMLSchema">${item.CODCOLIGADA}</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$RHTIPOUSR</b:Key>
        <b:Value i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">-1</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODIGOEXTERNO</b:Key>
        <b:Value i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">-1</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODSISTEMA</b:Key>
        <b:Value i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">F</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODUSUARIOSERVICO</b:Key>
        <b:Value i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema" />
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODUSUARIO</b:Key>
        <b:Value i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">${username}</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$IDPRJ</b:Key>
        <b:Value i:type="c:int" xmlns:c="http://www.w3.org/2001/XMLSchema">2</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CHAPAFUNCIONARIO</b:Key>
        <b:Value i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">-1</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODFILIAL</b:Key>
        <b:Value i:type="c:int" xmlns:c="http://www.w3.org/2001/XMLSchema">${item.CODFILIAL}</b:Value>
      </b:KeyValueOfanyTypeanyType>
    </a:_params>
    <a:Environment>DotNet</a:Environment>
  </Context>
  <CustomData i:nil="true" xmlns="http://www.totvs.com/" />
  <DisableIsolateProcess xmlns="http://www.totvs.com/">false</DisableIsolateProcess>
  <DriverType i:nil="true" xmlns="http://www.totvs.com/" />
  <ExecutionId xmlns="http://www.totvs.com/">${executionId}</ExecutionId>
  <FailureMessage xmlns="http://www.totvs.com/">Falha na execução do processo</FailureMessage>
  <FriendlyLogs i:nil="true" xmlns="http://www.totvs.com/" />
  <HideProgressDialog xmlns="http://www.totvs.com/">false</HideProgressDialog>
  <HostName xmlns="http://www.totvs.com/">PortalRM-Client</HostName>
  <Initialized xmlns="http://www.totvs.com/">true</Initialized>
  <Ip xmlns="http://www.totvs.com/">127.0.0.1</Ip>
  <IsolateProcess xmlns="http://www.totvs.com/">false</IsolateProcess>
  <JobID xmlns="http://www.totvs.com/">
    <Children />
    <ExecID>1</ExecID>
    <ID>1</ID>
    <IsPriorityJob>false</IsPriorityJob>
  </JobID>
  <JobServerHostName xmlns="http://www.totvs.com/">SERVER</JobServerHostName>
  <MasterActionName xmlns="http://www.totvs.com/">FinBorderoAction</MasterActionName>
  <MaximumQuantityOfPrimaryKeysPerProcess xmlns="http://www.totvs.com/">1000</MaximumQuantityOfPrimaryKeysPerProcess>
  <MinimumQuantityOfPrimaryKeysPerProcess xmlns="http://www.totvs.com/">1</MinimumQuantityOfPrimaryKeysPerProcess>
  <NetworkUser xmlns="http://www.totvs.com/">${username}</NetworkUser>
  <NotifyEmail xmlns="http://www.totvs.com/">false</NotifyEmail>
  <NotifyEmailList i:nil="true" xmlns="http://www.totvs.com/" xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays" />
  <NotifyFluig xmlns="http://www.totvs.com/">false</NotifyFluig>
  <OnlineMode xmlns="http://www.totvs.com/">false</OnlineMode>
  <PrimaryKeyList xmlns="http://www.totvs.com/" xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
    <a:ArrayOfanyType>
      <a:anyType i:type="b:short" xmlns:b="http://www.w3.org/2001/XMLSchema">${item.CODCOLIGADA}</a:anyType>
      <a:anyType i:type="b:short" xmlns:b="http://www.w3.org/2001/XMLSchema">${item.CODCOLCXA}</a:anyType>
      <a:anyType i:type="b:string" xmlns:b="http://www.w3.org/2001/XMLSchema">${item.CODCXA}</a:anyType>
      <a:anyType i:type="b:int" xmlns:b="http://www.w3.org/2001/XMLSchema">${item.IDBORDERO}</a:anyType>
    </a:ArrayOfanyType>
  </PrimaryKeyList>
  <PrimaryKeyNames xmlns="http://www.totvs.com/" xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
    <a:string>CODCOLIGADA</a:string>
    <a:string>CODCOLCXA</a:string>
    <a:string>CODCXA</a:string>
    <a:string>IDBORDERO</a:string>
  </PrimaryKeyNames>
  <PrimaryKeyTableName xmlns="http://www.totvs.com/">FBORDERO</PrimaryKeyTableName>
  <ProcessName xmlns="http://www.totvs.com/">Autorização de Borderô de Pagamentos</ProcessName>
  <QuantityOfSplits xmlns="http://www.totvs.com/">0</QuantityOfSplits>
  <SaveLogInDatabase xmlns="http://www.totvs.com/">true</SaveLogInDatabase>
  <SaveParamsExecution xmlns="http://www.totvs.com/">false</SaveParamsExecution>
  <ScheduleDateTime xmlns="http://www.totvs.com/">${scheduleDate}</ScheduleDateTime>
  <Scheduler xmlns="http://www.totvs.com/">JobMonitor</Scheduler>
  <SendMail xmlns="http://www.totvs.com/">false</SendMail>
  <ServerName xmlns="http://www.totvs.com/">FinBorderoAutzDataProc</ServerName>
  <ServiceInterface i:nil="true" xmlns="http://www.totvs.com/" xmlns:a="http://schemas.datacontract.org/2004/07/System" />
  <ShouldParallelize xmlns="http://www.totvs.com/">false</ShouldParallelize>
  <ShowReExecuteButton xmlns="http://www.totvs.com/">true</ShowReExecuteButton>
  <StatusMessage i:nil="true" xmlns="http://www.totvs.com/" />
  <SuccessMessage xmlns="http://www.totvs.com/">Processo executado com sucesso</SuccessMessage>
  <SyncExecution xmlns="http://www.totvs.com/">true</SyncExecution>
  <UseJobMonitor xmlns="http://www.totvs.com/">false</UseJobMonitor>
  <UserName xmlns="http://www.totvs.com/">${username}</UserName>
  <WaitSchedule xmlns="http://www.totvs.com/">false</WaitSchedule>
  <AtutorizaBoderoRemetido>false</AtutorizaBoderoRemetido>
  <Autoriza>true</Autoriza>
  <CodColigada>${item.CODCOLIGADA}</CodColigada>
  <CodUsuarioAutz>${username}</CodUsuarioAutz>
  <DataSistema>${todayDate}</DataSistema>
  <DataValidade>${todayDate}</DataValidade>
</FinBorderoAutzParamsProc>`;

  return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <tot:ExecuteWithXmlParams>
         <tot:ProcessServerName>FinBorderoAutzDataProc</tot:ProcessServerName>
         <tot:strXmlParams><![CDATA[${innerXml}]]></tot:strXmlParams>
      </tot:ExecuteWithXmlParams>
   </soapenv:Body>
</soapenv:Envelope>`;
};

export interface SoapXmlItem {
  CODCOLIGADA: number;
  ID: number;
  CODFILIAL: number;
  CODCOLCFO: number;
  CODCFO: string;
  CHAVEACESSO: string;
  NUMERO: string;
  [key: string]: any;
}

export interface SoapPoItem {
  IDMOV: number;
  NUMEROMOV: string;
  CODCOLIGADA: number;
  CODTMV?: string;
  [key: string]: any;
}

export interface SoapPoLineItem {
  NSEQITMMOV: number;
  IDPRD: number;
  CODUND: string;
  [key: string]: any;
}

export interface SoapXmlLineItem {
  nItem: string;
  cProd: string;
  qCom: number;
  uCom: string;
  [key: string]: any;
}

export interface SoapMapping {
  xmlIndex: number;
  poIndex: number;
}

export const getRecebimentoXmlSoap = (
  xmlItem: SoapXmlItem,
  selectedPo: SoapPoItem,
  xmlLines: SoapXmlLineItem[],
  poLines: SoapPoLineItem[],
  mappings: SoapMapping[],
  username: string
) => {
  const executionId = crypto.randomUUID();
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  const scheduleDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.0000000-03:00`;
  const todayDate = `${year}-${month}-${day}T00:00:00-03:00`;

  // Generate Produtos XML
  const produtosXml = mappings.map((m, index) => {
    const xmlLine = xmlLines[m.xmlIndex];
    const poLine = poLines[m.poIndex];
    const nSeqItmMov = index + 1; // Sequence in the new movement

    return `<a:MovTraducaoXMLProdutos z:Id="i${nSeqItmMov + 10}">
          <a:InternalId i:nil="true" />
          <CodUnd>${xmlLine.uCom}</CodUnd>
          <IdPrd>${poLine.IDPRD}</IdPrd>
          <NSeqItemMultiplo>-1</NSeqItemMultiplo>
          <NSeqItmMov>${nSeqItmMov}</NSeqItmMov>
          <Quantidade>${xmlLine.qCom}</Quantidade>
          <Relacionamento>
            <a:MovTraducaoXMLProdutosRelac z:Id="i${nSeqItmMov + 100}">
              <a:InternalId i:nil="true" />
              <CodColPedido>${selectedPo.CODCOLIGADA}</CodColPedido>
              <CodTmvPedido>${selectedPo.CODTMV || '1.1.03'}</CodTmvPedido>
              <CodUnd>${xmlLine.uCom}</CodUnd>
              <IdMovPedido>${selectedPo.IDMOV}</IdMovPedido>
              <NSeqItmMovPedido>${poLine.NSEQITMMOV}</NSeqItmMovPedido>
              <Quantidade>${xmlLine.qCom}</Quantidade>
            </a:MovTraducaoXMLProdutosRelac>
          </Relacionamento>
        </a:MovTraducaoXMLProdutos>`;
  }).join('\n        ');

  const innerXml = `<MovTraducaoXMLTOTVSColabParams z:Id="i1" xmlns="http://www.totvs.com.br/RM/" xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns:z="http://schemas.microsoft.com/2003/10/Serialization/">
  <ActionModule xmlns="http://www.totvs.com/">T</ActionModule>
  <ActionName xmlns="http://www.totvs.com/">MovTraducaoXMLTOTVSColabProcAction</ActionName>
  <CanParallelize xmlns="http://www.totvs.com/">true</CanParallelize>
  <CanSendMail xmlns="http://www.totvs.com/">false</CanSendMail>
  <CanWaitSchedule xmlns="http://www.totvs.com/">false</CanWaitSchedule>
  <CodUsuario xmlns="http://www.totvs.com/">${username}</CodUsuario>
  <ConnectionId i:nil="true" xmlns="http://www.totvs.com/" />
  <ConnectionString i:nil="true" xmlns="http://www.totvs.com/" />
  <Context z:Id="i2" xmlns="http://www.totvs.com/" xmlns:a="http://www.totvs.com.br/RM/">
    <a:_params xmlns:b="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$EXERCICIOFISCAL</b:Key>
        <b:Value i:type="c:int" xmlns:c="http://www.w3.org/2001/XMLSchema">22</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODLOCPRT</b:Key>
        <b:Value i:type="c:int" xmlns:c="http://www.w3.org/2001/XMLSchema">-1</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODTIPOCURSO</b:Key>
        <b:Value i:type="c:int" xmlns:c="http://www.w3.org/2001/XMLSchema">1</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$EDUTIPOUSR</b:Key>
        <b:Value i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">-1</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODUNIDADEBIB</b:Key>
        <b:Value i:type="c:int" xmlns:c="http://www.w3.org/2001/XMLSchema">1</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODCOLIGADA</b:Key>
        <b:Value i:type="c:int" xmlns:c="http://www.w3.org/2001/XMLSchema">${xmlItem.CODCOLIGADA}</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$RHTIPOUSR</b:Key>
        <b:Value i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">-1</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODIGOEXTERNO</b:Key>
        <b:Value i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">-1</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODSISTEMA</b:Key>
        <b:Value i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">T</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODUSUARIOSERVICO</b:Key>
        <b:Value i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema" />
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODUSUARIO</b:Key>
        <b:Value i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">${username}</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$IDPRJ</b:Key>
        <b:Value i:type="c:int" xmlns:c="http://www.w3.org/2001/XMLSchema">2</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CHAPAFUNCIONARIO</b:Key>
        <b:Value i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">-1</b:Value>
      </b:KeyValueOfanyTypeanyType>
      <b:KeyValueOfanyTypeanyType>
        <b:Key i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">$CODFILIAL</b:Key>
        <b:Value i:type="c:int" xmlns:c="http://www.w3.org/2001/XMLSchema">${xmlItem.CODFILIAL}</b:Value>
      </b:KeyValueOfanyTypeanyType>
    </a:_params>
    <a:Environment>DotNet</a:Environment>
  </Context>
  <CustomData i:nil="true" xmlns="http://www.totvs.com/" />
  <DisableIsolateProcess xmlns="http://www.totvs.com/">false</DisableIsolateProcess>
  <DriverType i:nil="true" xmlns="http://www.totvs.com/" />
  <ExecutionId xmlns="http://www.totvs.com/">${executionId}</ExecutionId>
  <FailureMessage xmlns="http://www.totvs.com/">Falha na execução do processo</FailureMessage>
  <FriendlyLogs i:nil="true" xmlns="http://www.totvs.com/" />
  <HideProgressDialog xmlns="http://www.totvs.com/">false</HideProgressDialog>
  <HostName xmlns="http://www.totvs.com/">PortalRM-Client</HostName>
  <Initialized xmlns="http://www.totvs.com/">true</Initialized>
  <Ip xmlns="http://www.totvs.com/">127.0.0.1</Ip>
  <IsolateProcess xmlns="http://www.totvs.com/">false</IsolateProcess>
  <JobID xmlns="http://www.totvs.com/">
    <Children />
    <ExecID>1</ExecID>
    <ID>1</ID>
    <IsPriorityJob>false</IsPriorityJob>
  </JobID>
  <JobServerHostName xmlns="http://www.totvs.com/">SERVER</JobServerHostName>
  <MasterActionName xmlns="http://www.totvs.com/">MovNfeEntradaAction</MasterActionName>
  <MaximumQuantityOfPrimaryKeysPerProcess xmlns="http://www.totvs.com/">1000</MaximumQuantityOfPrimaryKeysPerProcess>
  <MinimumQuantityOfPrimaryKeysPerProcess xmlns="http://www.totvs.com/">1</MinimumQuantityOfPrimaryKeysPerProcess>
  <NetworkUser xmlns="http://www.totvs.com/">${username}</NetworkUser>
  <NotifyEmail xmlns="http://www.totvs.com/">false</NotifyEmail>
  <NotifyEmailList i:nil="true" xmlns="http://www.totvs.com/" xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays" />
  <NotifyFluig xmlns="http://www.totvs.com/">false</NotifyFluig>
  <OnlineMode xmlns="http://www.totvs.com/">false</OnlineMode>
  <PrimaryKeyList xmlns="http://www.totvs.com/" xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
    <a:ArrayOfanyType>
      <a:anyType i:type="b:int" xmlns:b="http://www.w3.org/2001/XMLSchema">${xmlItem.ID}</a:anyType>
      <a:anyType i:type="b:short" xmlns:b="http://www.w3.org/2001/XMLSchema">${xmlItem.CODCOLIGADA}</a:anyType>
    </a:ArrayOfanyType>
  </PrimaryKeyList>
  <PrimaryKeyNames xmlns="http://www.totvs.com/" xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
    <a:string>ID</a:string>
    <a:string>CODCOLIGADA</a:string>
  </PrimaryKeyNames>
  <PrimaryKeyTableName xmlns="http://www.totvs.com/">TNFEENTRADA</PrimaryKeyTableName>
  <ProcessName xmlns="http://www.totvs.com/">Inclusão de Movimento através de XML - NF-e</ProcessName>
  <QuantityOfSplits xmlns="http://www.totvs.com/">0</QuantityOfSplits>
  <SaveLogInDatabase xmlns="http://www.totvs.com/">true</SaveLogInDatabase>
  <SaveParamsExecution xmlns="http://www.totvs.com/">false</SaveParamsExecution>
  <ScheduleDateTime xmlns="http://www.totvs.com/">${scheduleDate}</ScheduleDateTime>
  <Scheduler xmlns="http://www.totvs.com/">JobMonitor</Scheduler>
  <SendMail xmlns="http://www.totvs.com/">false</SendMail>
  <ServerName xmlns="http://www.totvs.com/">MovTraducaoXMLTOTVSColabProc</ServerName>
  <ServiceInterface i:nil="true" xmlns="http://www.totvs.com/" xmlns:a="http://schemas.datacontract.org/2004/07/System" />
  <ShouldParallelize xmlns="http://www.totvs.com/">false</ShouldParallelize>
  <ShowReExecuteButton xmlns="http://www.totvs.com/">true</ShowReExecuteButton>
  <StatusMessage i:nil="true" xmlns="http://www.totvs.com/" />
  <SuccessMessage xmlns="http://www.totvs.com/">Processo executado com sucesso</SuccessMessage>
  <SyncExecution xmlns="http://www.totvs.com/">true</SyncExecution>
  <UseJobMonitor xmlns="http://www.totvs.com/">false</UseJobMonitor>
  <UserName xmlns="http://www.totvs.com/">${username}</UserName>
  <WaitSchedule xmlns="http://www.totvs.com/">false</WaitSchedule>
  <AbrirTelaEdicao>true</AbrirTelaEdicao>
  <LogExecucaoTela xmlns:a="http://schemas.datacontract.org/2004/07/System.Text">
    <m_MaxCapacity i:type="b:int" xmlns="" xmlns:b="http://www.w3.org/2001/XMLSchema">2147483647</m_MaxCapacity>
    <Capacity i:type="b:int" xmlns="" xmlns:b="http://www.w3.org/2001/XMLSchema">16</Capacity>
    <m_StringValue i:type="b:string" xmlns="" xmlns:b="http://www.w3.org/2001/XMLSchema" />
    <m_currentThread i:type="b:int" xmlns="" xmlns:b="http://www.w3.org/2001/XMLSchema">0</m_currentThread>
  </LogExecucaoTela>
  <Notas xmlns:a="http://www.totvs.com/">
    <a:MovTraducaoXMLNotas z:Id="i3">
      <a:InternalId i:nil="true" />
      <ChaveAcesso>${xmlItem.CHAVEACESSO}</ChaveAcesso>
      <CodCfo>${xmlItem.CODCFO}</CodCfo>
      <CodColCfo>${xmlItem.CODCOLCFO || 1}</CodColCfo>
      <CodColigada>${xmlItem.CODCOLIGADA}</CodColigada>
      <CodFilial>${xmlItem.CODFILIAL}</CodFilial>
      <CodTmv>1.2.01</CodTmv>
      <IdMov>${xmlItem.ID}</IdMov>
      <MovimentoTraduzido>0</MovimentoTraduzido>
      <NumeroMov>${xmlItem.NUMERO}</NumeroMov>
      <Produtos>
        ${produtosXml}
      </Produtos>
      <ReceberPedido>true</ReceberPedido>
    </a:MovTraducaoXMLNotas>
  </Notas>
  <OrigemFaturamentoOuCopiaRef>InclusaoManual</OrigemFaturamentoOuCopiaRef>
  <DataSistema>${todayDate}</DataSistema>
  <ExercicioFiscal>22</ExercicioFiscal>
  <MovimentosCopia_Entrada i:nil="true" xmlns:a="http://www.totvs.com/" />
  <MovimentosCopia_Saida i:nil="true" xmlns:a="http://www.totvs.com/" />
  <listaNotasTraduzidas xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
    <a:KeyValueOfintMovMovInclusaoParyQBb9fnp>
      <a:Key>${xmlItem.ID}</a:Key>
      <a:Value z:Id="i500">
        <InternalId i:nil="true" xmlns="http://www.totvs.com/" />
        <InternalId i:nil="true" xmlns="http://www.totvs.com/" />
        <CodColigada>${xmlItem.CODCOLIGADA}</CodColigada>
        <CodSistemaLogado i:nil="true" />
        <CodUsuarioLogado>${username}</CodUsuarioLogado>
        <IdExercicioFiscal>22</IdExercicioFiscal>
        <IdMov>-1</IdMov>
        <AbatimentoICMS>0</AbatimentoICMS>
        <ChaveAcessoNFe>${xmlItem.CHAVEACESSO}</ChaveAcessoNFe>
        <CodCfo>${xmlItem.CODCFO}</CodCfo>
        <CodColCfo>${xmlItem.CODCOLCFO || 1}</CodColCfo>
        <CodColigada>${xmlItem.CODCOLIGADA}</CodColigada>
        <CodFilial>${xmlItem.CODFILIAL}</CodFilial>
        <CodTMv>1.2.01</CodTMv>
        <CodUsuario>${username}</CodUsuario>
        <DataEmissao>${xmlItem.DATAEMISSAO}</DataEmissao>
        <DataMovimento>${todayDate}</DataMovimento>
        <IdXmlTotvsColab>${xmlItem.ID}</IdXmlTotvsColab>
        <OperacaoConsumidorFinal>1</OperacaoConsumidorFinal>
        <OperacaoPresencial>0</OperacaoPresencial>
        <Status>A</Status>
        <ItemMovimento xmlns:b="http://www.totvs.com/">
          ${mappings.map((m, idx) => {
             const xmlLine = xmlLines[m.xmlIndex];
             const poLine = poLines[m.poIndex];
             return `<b:MovMovItemMovPar z:Id="i${600 + idx}">
                <b:InternalId i:nil="true" />
                <b:InternalId i:nil="true" />
                <AAlistModified xmlns:c="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
                  <c:string>NumeroSequencial</c:string>
                  <c:string>IdPrd</c:string>
                  <c:string>Quantidade</c:string>
                  <c:string>PrecoUnitario</c:string>
                  <c:string>ValorBrutoItem</c:string>
                  <c:string>ValorTotalItem</c:string>
                  <c:string>CodUnd</c:string>
                  <c:string>DescricaoPrdCfo</c:string>
                </AAlistModified>
                <CodColigada>${xmlItem.CODCOLIGADA}</CodColigada>
                <CodFilial>${xmlItem.CODFILIAL}</CodFilial>
                <IdPrd>${poLine.IDPRD}</IdPrd>
                <CodUnd>${xmlLine.uCom}</CodUnd>
                <Quantidade>${xmlLine.qCom}</Quantidade>
                <PrecoUnitario>${xmlLine.vUnCom}</PrecoUnitario>
                <ValorBrutoItem>${xmlLine.vProd}</ValorBrutoItem>
                <ValorTotalItem>${xmlLine.vProd}</ValorTotalItem>
                <DataEmissao>${xmlItem.DATAEMISSAO}</DataEmissao>
                <DescricaoPrdCfo>${xmlLine.xProd}</DescricaoPrdCfo>
                <NumeroSequencial>${idx + 1}</NumeroSequencial>
                <IdMov>-1</IdMov>
                <InfPrdXml z:Id="i${800 + idx}">
                   <b:InternalId i:nil="true" />
                   <b:InternalId i:nil="true" />
                   <CodigoPrdCfo>${xmlLine.cProd}</CodigoPrdCfo>
                   <CodigoUndCfo>${xmlLine.uCom}</CodigoUndCfo>
                   <NomeFantasiaPrdCfo>${xmlLine.xProd}</NomeFantasiaPrdCfo>
                </InfPrdXml>
             </b:MovMovItemMovPar>`;
          }).join('\n          ')}
        </ItemMovimento>
      </a:Value>
    </a:KeyValueOfintMovMovInclusaoParyQBb9fnp>
  </listaNotasTraduzidas>
</MovTraducaoXMLTOTVSColabParams>`;

  return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <tot:ExecuteWithXmlParams>
         <tot:ProcessServerName>MovTraducaoXMLTOTVSColabProc</tot:ProcessServerName>
         <tot:strXmlParams><![CDATA[${innerXml}]]></tot:strXmlParams>
      </tot:ExecuteWithXmlParams>
   </soapenv:Body>
</soapenv:Envelope>`;
};

