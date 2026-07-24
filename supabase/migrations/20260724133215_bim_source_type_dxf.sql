-- DXF joins the BIM source formats: the universal CAD exchange format, and
-- now the second web-viewable one (dxf-viewer client beside the IFC viewer).
alter type bim_source_type add value if not exists 'dxf';
