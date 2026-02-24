
import mongoose from 'mongoose';
import { Tenant } from '../server/models/Tenant';
import { TenantService } from '../server/services/tenant-service';

const MONGO_URI = 'mongodb+srv://simpleitsolucoes:%40n%40R%40quel110987@portalrm.ckh4qik.mongodb.net/?appName=PortalRM';

const testUpdate = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: 'portalrm_db',
    });
    console.log('✅ Connected to MongoDB');

    // Find the 'simpleit' tenant
    const tenant = await Tenant.findOne({ tenantKey: 'simpleit' });
    if (!tenant) {
        console.log('Tenant simpleit not found');
        return;
    }

    console.log('Current environments count:', tenant.environments.length);

    // Create a new environment payload
    const newEnvs = [
        ...tenant.environments.map(e => e.toObject()),
        {
            name: "Test Environment " + Date.now(),
            enabled: true,
            webserviceBaseUrl: "http://test.com",
            authMode: "bearer",
            modules: {
                dashboard_principal: true
            }
        }
    ];

    console.log('Updating with environments count:', newEnvs.length);

    // Call updateTenant
    const updated = await TenantService.updateTenant(tenant._id.toString(), {
        environments: newEnvs
    });

    console.log('Updated environments count:', updated.environments.length);
    console.log('Saved successfully.');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error testing update:', err);
  }
};

testUpdate();
