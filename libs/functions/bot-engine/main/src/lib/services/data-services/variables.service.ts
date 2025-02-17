import { HandlerTools } from '@iote/cqrs';

import { BotDataService } from './data-service-abstract.class';

/**
 * Contains all the required database flow methods for the chat-status collection
 */
export class VariablesDataService extends BotDataService<any>{
  private _docPath: string;
  tools: HandlerTools;
  endUserId: string;

  constructor(tools: HandlerTools, orgId: string, endUserId: string) 
  {
    super(tools);
    this.tools = tools;
    this._init(orgId, endUserId);
  }

  protected _init(orgId: string, endUserId:string): void 
  {
    this._docPath = `orgs/${orgId}/end-users`;

    this.endUserId = endUserId;
  }

  public async getAllVariables() {
   const endUser = await this.getDocumentById(this.endUserId,this._docPath);

   return endUser.variables;
  }

  public async getSpecificVariable(varName: string) {
    const allVariables = await this.getAllVariables()

    if (allVariables) return allVariables[varName]
    else return null
  }
}
